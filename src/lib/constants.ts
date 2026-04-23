export type UserRole = 'student' | 'moderator' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export type ItemType = 'lost' | 'found';
export type ItemStatus = 'open' | 'potential_match' | 'claimed' | 'returned' | 'closed';
export type ItemCategory = 'electronics' | 'clothing' | 'id_keys' | 'bags' | 'books' | 'other';

export interface Item {
  id: string;
  type: ItemType;
  title: string;
  description: string;
  category: ItemCategory;
  location: string;
  date: string;
  photos: string[];
  status: ItemStatus;
  reporterId: string;
  contactPreference: 'email' | 'in_app';
  createdAt: string;
}

export interface Match {
  id: string;
  lostItemId: string;
  foundItemId: string;
  score: number;
  reason: string;
  status: 'pending' | 'accepted' | 'dismissed';
}

export interface Claim {
  id: string;
  itemId: string;
  claimerId: string;
  verificationAnswers: Record<string, string>;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: 'match' | 'claim' | 'approval' | 'return' | 'system';
  read: boolean;
  createdAt: string;
}

export const CAMPUS_LOCATIONS = [
  'Babbio Center', 'Edwin A. Stevens Hall', 'Burchard Building',
  'McLean Hall', 'Palmer Hall', 'Morton-Peirce-Kidde Complex',
  'Howe Center', 'Library', 'Student Center', 'Schaefer Athletic Center',
  'Gateway Academic Center', 'Bissinger Room', 'DeBaun Auditorium',
  'Campus Quad', 'Castle Point Lookout', 'River Terrace',
] as const;

export const CATEGORY_LABELS: Record<ItemCategory, string> = {
  electronics: 'Electronics',
  clothing: 'Clothing',
  id_keys: 'ID / Keys',
  bags: 'Bags',
  books: 'Books',
  other: 'Other',
};

export const STATUS_LABELS: Record<ItemStatus, string> = {
  open: 'Open',
  potential_match: 'Potential Match',
  claimed: 'Claimed',
  returned: 'Returned',
  closed: 'Closed',
};

export const STEVENS_EMAIL_DOMAIN = '@stevens.edu';
