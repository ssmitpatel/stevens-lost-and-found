import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useStartConversation, useSendMessage } from '@/hooks/use-chat';
import type { Item, User } from '@/lib/constants';

interface ChatLauncherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The user you want to message. */
  recipient: User | null;
  /** Optional item to tag the first message with (renders as a clickable card in chat). */
  taggedItem?: Item | null;
  /** Pre-fill the message body. User can edit before sending. */
  defaultMessage?: string;
  /** If true, navigate to /app/messages?c=... after sending. Defaults to true. */
  navigateAfter?: boolean;
}

export function ChatLauncherDialog({
  open,
  onOpenChange,
  recipient,
  taggedItem,
  defaultMessage = '',
  navigateAfter = true,
}: ChatLauncherDialogProps) {
  const navigate = useNavigate();
  const startConvo = useStartConversation();
  const sendMessage = useSendMessage();
  const [body, setBody] = useState(defaultMessage);

  useEffect(() => {
    if (open) setBody(defaultMessage);
  }, [open, defaultMessage]);

  if (!recipient) return null;

  const submitting = startConvo.isPending || sendMessage.isPending;

  const handleSend = async () => {
    const trimmed = body.trim();
    if (!trimmed) {
      toast.error('Please write a short message.');
      return;
    }
    try {
      const convo = await startConvo.mutateAsync(recipient.id);
      await sendMessage.mutateAsync({
        conversationId: convo.id,
        body: trimmed,
        itemId: taggedItem?.id,
      });
      toast.success(`Message sent to ${recipient.name}`);
      onOpenChange(false);
      if (navigateAfter) navigate(`/app/messages?c=${convo.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not send message.';
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4 text-primary" />
            Message {recipient.name}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Start an in-app conversation. They'll be notified the next time they open the app.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-2.5">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-gradient-to-br from-primary to-rose-600 text-white text-xs font-semibold">
              {recipient.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{recipient.name}</p>
            <p className="text-[11px] text-muted-foreground truncate">{recipient.email}</p>
          </div>
        </div>

        {taggedItem && (
          <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-2.5 flex gap-2.5">
            {taggedItem.photos[0] ? (
              <img
                src={taggedItem.photos[0]}
                alt=""
                className="h-12 w-12 rounded object-cover shrink-0"
              />
            ) : (
              <div className="h-12 w-12 rounded bg-muted shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wider text-primary font-semibold">
                Tagged item
              </p>
              <p className="text-xs font-medium truncate">{taggedItem.title}</p>
              <p className="text-[11px] text-muted-foreground truncate">
                {taggedItem.location}
              </p>
            </div>
          </div>
        )}

        <Textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder={`Hi ${recipient.name.split(' ')[0]}, …`}
          className="min-h-[110px] text-sm"
          autoFocus
        />

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={submitting} className="gap-1.5">
            {submitting ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" />Sending…</>
            ) : (
              <><Send className="h-3.5 w-3.5" />Send</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
