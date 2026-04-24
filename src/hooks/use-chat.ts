import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchConversations,
  fetchMessages,
  getOrCreateConversation,
  sendMessage,
  markConversationRead,
} from '@/lib/supabase-data';
import { useAuth } from '@/contexts/AuthContext';

const POLL_MS = 4000;

export function useConversations() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: () => (user ? fetchConversations(user.id) : []),
    enabled: !!user,
    refetchInterval: POLL_MS,
  });
}

export function useUnreadChatCount() {
  const { data = [] } = useConversations();
  return data.filter(c => c.unread).length;
}

export function useMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => (conversationId ? fetchMessages(conversationId) : []),
    enabled: !!conversationId,
    refetchInterval: POLL_MS,
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (input: { conversationId: string; body: string; itemId?: string }) => {
      if (!user) throw new Error('Not signed in.');
      return sendMessage({ ...input, senderId: user.id });
    },
    onSuccess: (_msg, vars) => {
      qc.invalidateQueries({ queryKey: ['messages', vars.conversationId] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useStartConversation() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (otherUserId: string) => {
      if (!user) throw new Error('Not signed in.');
      return getOrCreateConversation(user.id, otherUserId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useMarkConversationRead() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (conversationId: string) => {
      if (!user) throw new Error('Not signed in.');
      return markConversationRead(conversationId, user.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
