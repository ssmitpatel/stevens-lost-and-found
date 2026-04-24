import { supabase, ITEM_PHOTOS_BUCKET } from '@/lib/supabase';
import type {
  Item, ItemType, ItemStatus, ItemCategory,
  Match, Claim, Notification, User,
  Conversation, ChatMessage, ConversationWithMeta,
} from '@/lib/constants';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert a DB row (snake_case) to an Item (camelCase). */
function toItem(row: Record<string, unknown>): Item {
  return {
    id: row.id as string,
    type: row.type as ItemType,
    title: row.title as string,
    description: row.description as string,
    category: row.category as ItemCategory,
    location: row.location as string,
    date: row.date as string,
    photos: (row.photos as string[]) ?? [],
    status: row.status as ItemStatus,
    reporterId: row.reporter_id as string,
    contactPreference: row.contact_preference as 'email' | 'in_app',
    createdAt: row.created_at as string,
  };
}

function toMatch(row: Record<string, unknown>): Match {
  return {
    id: row.id as string,
    lostItemId: row.lost_item_id as string,
    foundItemId: row.found_item_id as string,
    score: row.score as number,
    reason: row.reason as string,
    status: row.status as 'pending' | 'accepted' | 'dismissed',
  };
}

function toClaim(row: Record<string, unknown>): Claim {
  return {
    id: row.id as string,
    itemId: row.item_id as string,
    claimerId: row.claimer_id as string,
    verificationAnswers: (row.verification_answers as Record<string, string>) ?? {},
    status: row.status as 'pending' | 'approved' | 'rejected',
    reviewedBy: (row.reviewed_by as string) ?? undefined,
    createdAt: row.created_at as string,
  };
}

function toNotification(row: Record<string, unknown>): Notification {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    message: row.message as string,
    type: row.type as Notification['type'],
    read: row.read as boolean,
    createdAt: row.created_at as string,
  };
}

function toProfile(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    email: row.email as string,
    name: row.name as string,
    role: row.role as User['role'],
    avatar: (row.avatar as string) ?? undefined,
  };
}

// ─── Items ────────────────────────────────────────────────────────────────────

export interface ItemFilters {
  type?: ItemType;
  category?: ItemCategory;
  status?: ItemStatus;
  location?: string;
  reporterId?: string;
  query?: string;
  includeClosed?: boolean;
}

export async function fetchItems(filters: ItemFilters = {}): Promise<Item[]> {
  let q = supabase.from('items').select('*').order('created_at', { ascending: false });

  if (filters.type) q = q.eq('type', filters.type);
  if (filters.category) q = q.eq('category', filters.category);
  if (filters.status) q = q.eq('status', filters.status);
  if (filters.location) q = q.eq('location', filters.location);
  if (filters.reporterId) q = q.eq('reporter_id', filters.reporterId);
  if (filters.query) {
    q = q.or(
      `title.ilike.%${filters.query}%,description.ilike.%${filters.query}%,location.ilike.%${filters.query}%`,
    );
  }

  // Hide closed items by default unless explicitly included or explicitly querying for closed status
  if (!filters.includeClosed && filters.status !== 'closed') {
    q = q.neq('status', 'closed');
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(toItem);
}

export async function fetchItemById(id: string): Promise<Item | null> {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null; // not found
    throw error;
  }
  return data ? toItem(data) : null;
}

export async function createItem(
  item: Omit<Item, 'id' | 'createdAt' | 'status'>,
): Promise<Item> {
  const { data, error } = await supabase
    .from('items')
    .insert({
      type: item.type,
      title: item.title,
      description: item.description,
      category: item.category,
      location: item.location,
      date: item.date,
      photos: item.photos,
      reporter_id: item.reporterId,
      contact_preference: item.contactPreference,
    })
    .select()
    .single();

  if (error) throw error;
  return toItem(data);
}

export async function updateItemStatus(id: string, status: ItemStatus): Promise<void> {
  const { error } = await supabase.from('items').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function deleteItem(id: string): Promise<void> {
  const { error } = await supabase.from('items').delete().eq('id', id);
  if (error) throw error;
}

// ─── Photos ───────────────────────────────────────────────────────────────────

export async function uploadItemPhoto(file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(ITEM_PHOTOS_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from(ITEM_PHOTOS_BUCKET)
    .getPublicUrl(path);

  return urlData.publicUrl;
}

// ─── Matches ──────────────────────────────────────────────────────────────────

export async function fetchMatches(itemId?: string): Promise<Match[]> {
  let q = supabase.from('matches').select('*').order('created_at', { ascending: false });

  if (itemId) {
    q = q.or(`lost_item_id.eq.${itemId},found_item_id.eq.${itemId}`);
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(toMatch);
}

export async function updateMatchStatus(
  id: string,
  status: 'accepted' | 'dismissed',
): Promise<void> {
  const { error } = await supabase.from('matches').update({ status }).eq('id', id);
  if (error) throw error;
}

// ─── Claims ───────────────────────────────────────────────────────────────────

export async function fetchClaims(itemId?: string): Promise<Claim[]> {
  let q = supabase.from('claims').select('*').order('created_at', { ascending: false });
  if (itemId) q = q.eq('item_id', itemId);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(toClaim);
}

export async function createClaim(claim: {
  itemId: string;
  claimerId: string;
  verificationAnswers: Record<string, string>;
}): Promise<Claim> {
  const { data, error } = await supabase
    .from('claims')
    .insert({
      item_id: claim.itemId,
      claimer_id: claim.claimerId,
      verification_answers: claim.verificationAnswers,
    })
    .select()
    .single();

  if (error) throw error;
  return toClaim(data);
}

export async function updateClaimStatus(
  id: string,
  status: 'approved' | 'rejected',
  reviewedBy: string,
): Promise<void> {
  const { error } = await supabase
    .from('claims')
    .update({ status, reviewed_by: reviewedBy })
    .eq('id', id);
  if (error) throw error;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function fetchNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(toNotification);
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id);
  if (error) throw error;
}

// ─── Profiles ─────────────────────────────────────────────────────────────────

export async function fetchProfile(userId: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) return null;
    return toProfile(data);
  } catch {
    return null;
  }
}

export async function fetchProfiles(): Promise<User[]> {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) throw error;
  return (data ?? []).map(toProfile);
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

function toConversation(row: Record<string, unknown>): Conversation {
  return {
    id: row.id as string,
    userA: row.user_a as string,
    userB: row.user_b as string,
    lastMessageAt: row.last_message_at as string,
    lastReadA: row.last_read_a as string,
    lastReadB: row.last_read_b as string,
    createdAt: row.created_at as string,
  };
}

function toMessage(row: Record<string, unknown>): ChatMessage {
  return {
    id: row.id as string,
    conversationId: row.conversation_id as string,
    senderId: row.sender_id as string,
    body: row.body as string,
    itemId: (row.item_id as string) ?? undefined,
    createdAt: row.created_at as string,
  };
}

/** Sort two user ids so we can store/lookup the unique pair deterministically. */
function orderedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

/**
 * Find the existing 1-on-1 conversation for these two users, or create one.
 * Always returns the conversation row.
 */
export async function getOrCreateConversation(
  meId: string,
  otherId: string,
): Promise<Conversation> {
  if (meId === otherId) {
    throw new Error('Cannot start a conversation with yourself.');
  }
  const [userA, userB] = orderedPair(meId, otherId);

  const existing = await supabase
    .from('conversations')
    .select('*')
    .eq('user_a', userA)
    .eq('user_b', userB)
    .maybeSingle();

  if (existing.error) throw existing.error;
  if (existing.data) return toConversation(existing.data);

  const { data, error } = await supabase
    .from('conversations')
    .insert({ user_a: userA, user_b: userB })
    .select()
    .single();
  if (error) throw error;
  return toConversation(data);
}

/**
 * Fetch all conversations where the current user is a participant, with
 * preview/unread metadata joined in.
 */
export async function fetchConversations(meId: string): Promise<ConversationWithMeta[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .or(`user_a.eq.${meId},user_b.eq.${meId}`)
    .order('last_message_at', { ascending: false });

  if (error) throw error;
  const convos = (data ?? []).map(toConversation);

  if (convos.length === 0) return [];

  // Fetch the latest message per conversation in one round trip.
  const ids = convos.map(c => c.id);
  const { data: msgRows, error: msgErr } = await supabase
    .from('messages')
    .select('*')
    .in('conversation_id', ids)
    .order('created_at', { ascending: false });
  if (msgErr) throw msgErr;

  const latest = new Map<string, ChatMessage>();
  for (const row of msgRows ?? []) {
    const m = toMessage(row);
    if (!latest.has(m.conversationId)) latest.set(m.conversationId, m);
  }

  return convos.map(c => {
    const otherUserId = c.userA === meId ? c.userB : c.userA;
    const myLastRead = c.userA === meId ? c.lastReadA : c.lastReadB;
    const last = latest.get(c.id);
    const unread = !!last && last.senderId !== meId && last.createdAt > myLastRead;
    return {
      ...c,
      otherUserId,
      unread,
      preview: last?.body,
      previewSenderId: last?.senderId,
    };
  });
}

export async function fetchMessages(conversationId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(toMessage);
}

export async function sendMessage(input: {
  conversationId: string;
  senderId: string;
  body: string;
  itemId?: string;
}): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: input.conversationId,
      sender_id: input.senderId,
      body: input.body,
      item_id: input.itemId ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return toMessage(data);
}

/**
 * Mark a conversation as read for the current user (advances their
 * `last_read_*` watermark to now).
 */
export async function markConversationRead(
  conversationId: string,
  meId: string,
): Promise<void> {
  // We need to know which slot we are (a or b) to update the right column.
  const { data, error } = await supabase
    .from('conversations')
    .select('user_a, user_b')
    .eq('id', conversationId)
    .single();
  if (error) throw error;

  const column = data.user_a === meId ? 'last_read_a' : 'last_read_b';
  const { error: updErr } = await supabase
    .from('conversations')
    .update({ [column]: new Date().toISOString() })
    .eq('id', conversationId);
  if (updErr) throw updErr;
}
