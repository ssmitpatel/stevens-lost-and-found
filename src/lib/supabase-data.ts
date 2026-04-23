import { supabase, ITEM_PHOTOS_BUCKET } from '@/lib/supabase';
import type {
  Item, ItemType, ItemStatus, ItemCategory,
  Match, Claim, Notification, User,
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
