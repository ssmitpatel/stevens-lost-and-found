import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Send, Loader2, MessageSquare, Tag, ArrowLeft } from 'lucide-react';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import {
  useConversations,
  useMessages,
  useSendMessage,
  useMarkConversationRead,
} from '@/hooks/use-chat';
import { fetchProfiles } from '@/lib/supabase-data';
import { useItems } from '@/hooks/use-items';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { User, Item, ChatMessage } from '@/lib/constants';

function formatTimestamp(iso: string) {
  const d = parseISO(iso);
  if (isToday(d)) return format(d, 'h:mm a');
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d');
}

export default function MessagesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeId = searchParams.get('c') ?? undefined;

  const { data: conversations = [], isLoading } = useConversations();
  const { data: messages = [], isLoading: msgsLoading } = useMessages(activeId);
  const sendMessage = useSendMessage();
  const markRead = useMarkConversationRead();

  const { data: items = [] } = useItems({ includeClosed: true });
  const itemMap = useMemo(() => new Map(items.map(i => [i.id, i])), [items]);

  const [profileMap, setProfileMap] = useState<Map<string, User>>(new Map());
  useEffect(() => {
    fetchProfiles().then(profs => {
      setProfileMap(new Map(profs.map(p => [p.id, p])));
    });
  }, []);

  const [draft, setDraft] = useState('');
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages.length, activeId]);

  // Mark active conversation as read whenever messages change.
  useEffect(() => {
    if (!activeId) return;
    if (!messages.length) return;
    const last = messages[messages.length - 1];
    if (last.senderId !== user?.id) {
      markRead.mutate(activeId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, messages.length]);

  const activeConvo = conversations.find(c => c.id === activeId);
  const activeOther = activeConvo ? profileMap.get(activeConvo.otherUserId) : undefined;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body || !activeId) return;
    setDraft('');
    try {
      await sendMessage.mutateAsync({ conversationId: activeId, body });
    } catch {
      setDraft(body);
    }
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] flex">
      {/* Conversation list */}
      <aside
        className={cn(
          'border-r bg-card/50 w-full sm:w-72 lg:w-80 shrink-0 flex flex-col',
          activeId && 'hidden sm:flex',
        )}
      >
        <div className="p-4 border-b">
          <h1 className="text-sm font-semibold flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> Messages
          </h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Direct conversations with other Stevens students.
          </p>
        </div>

        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="p-6 flex justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>No conversations yet.</p>
              <p className="mt-1">
                Start one from any item page using the <strong>Chat</strong> button.
              </p>
            </div>
          ) : (
            <ul className="py-1">
              {conversations.map(c => {
                const other = profileMap.get(c.otherUserId);
                const isActive = c.id === activeId;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setSearchParams({ c: c.id })}
                      className={cn(
                        'w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-accent/60',
                        isActive && 'bg-primary/10',
                      )}
                    >
                      <Avatar className="h-9 w-9 mt-0.5">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-rose-600 text-white text-xs font-semibold">
                          {other?.name.charAt(0).toUpperCase() ?? '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className={cn('text-sm truncate', c.unread ? 'font-semibold' : 'font-medium')}>
                            {other?.name ?? 'Unknown user'}
                          </span>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {formatTimestamp(c.lastMessageAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <p
                            className={cn(
                              'text-[11px] truncate flex-1',
                              c.unread ? 'text-foreground font-medium' : 'text-muted-foreground',
                            )}
                          >
                            {c.previewSenderId === user?.id && 'You: '}
                            {c.preview ?? 'No messages yet.'}
                          </p>
                          {c.unread && (
                            <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* Active thread */}
      <section
        className={cn(
          'flex-1 flex flex-col min-w-0',
          !activeId && 'hidden sm:flex',
        )}
      >
        {!activeId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground p-6">
            <MessageSquare className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">Pick a conversation on the left.</p>
          </div>
        ) : (
          <>
            <header className="h-14 border-b flex items-center gap-3 px-4 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:hidden"
                onClick={() => setSearchParams({})}
                aria-label="Back"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-br from-primary to-rose-600 text-white text-xs font-semibold">
                  {activeOther?.name.charAt(0).toUpperCase() ?? '?'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{activeOther?.name ?? 'Unknown'}</p>
                <p className="text-[11px] text-muted-foreground truncate">{activeOther?.email}</p>
              </div>
            </header>

            <div ref={messagesRef} className="flex-1 overflow-auto p-4 space-y-2">
              {msgsLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground mt-6">
                  No messages yet — say hi.
                </p>
              ) : (
                messages.map(m => (
                  <MessageBubble
                    key={m.id}
                    message={m}
                    isMe={m.senderId === user?.id}
                    item={m.itemId ? itemMap.get(m.itemId) : undefined}
                    onItemClick={(id) => navigate(`/app/item/${id}`)}
                  />
                ))
              )}
            </div>

            <form onSubmit={handleSend} className="p-3 border-t flex gap-2">
              <Input
                value={draft}
                onChange={e => setDraft(e.target.value)}
                placeholder="Write a message…"
                className="text-sm h-9"
                autoFocus
              />
              <Button type="submit" size="sm" disabled={!draft.trim() || sendMessage.isPending} className="gap-1.5">
                {sendMessage.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                Send
              </Button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}

function MessageBubble({
  message,
  isMe,
  item,
  onItemClick,
}: {
  message: ChatMessage;
  isMe: boolean;
  item?: Item;
  onItemClick: (id: string) => void;
}) {
  return (
    <div className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[78%] flex flex-col gap-1', isMe ? 'items-end' : 'items-start')}>
        {item && (
          <Card
            className="cursor-pointer hover:bg-muted/60 transition-colors p-2 flex gap-2 max-w-full border-primary/30 bg-primary/5"
            onClick={() => onItemClick(item.id)}
          >
            {item.photos[0] ? (
              <img src={item.photos[0]} alt="" className="h-10 w-10 rounded object-cover shrink-0" />
            ) : (
              <div className="h-10 w-10 rounded bg-muted shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wider text-primary font-semibold flex items-center gap-1">
                <Tag className="h-2.5 w-2.5" /> {item.type}
              </p>
              <p className="text-xs font-medium truncate">{item.title}</p>
            </div>
          </Card>
        )}
        <div
          className={cn(
            'rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words',
            isMe
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-muted rounded-bl-sm',
          )}
        >
          {message.body}
        </div>
        <span className="text-[10px] text-muted-foreground px-1">
          {format(parseISO(message.createdAt), 'h:mm a')}
        </span>
      </div>
    </div>
  );
}
