import macbookImg from '@/assets/items/macbook.jpg';
import backpackImg from '@/assets/items/backpack.jpg';
import idCardImg from '@/assets/items/id-card.jpg';
import airpodsImg from '@/assets/items/airpods.jpg';
import calculatorImg from '@/assets/items/calculator.jpg';
import hoodieImg from '@/assets/items/hoodie.jpg';
import keysImg from '@/assets/items/keys.jpg';

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

export const mockUsers: User[] = [
  { id: 'u1', email: 'jdoe@stevens.edu', name: 'John Doe', role: 'student' },
  { id: 'u2', email: 'asmith@stevens.edu', name: 'Alice Smith', role: 'moderator' },
  { id: 'u3', email: 'admin@stevens.edu', name: 'Campus Admin', role: 'admin' },
  { id: 'u4', email: 'bwong@stevens.edu', name: 'Brian Wong', role: 'student' },
  { id: 'u5', email: 'mgarcia@stevens.edu', name: 'Maria Garcia', role: 'student' },
];

export const mockItems: Item[] = [
  {
    id: 'i1', type: 'lost', title: 'MacBook Pro 14"', description: 'Silver MacBook Pro with a red case. Last seen in Babbio 2nd floor study area.',
    category: 'electronics', location: 'Babbio Center', date: '2026-04-07T14:30:00', photos: [macbookImg],
    status: 'open', reporterId: 'u1', contactPreference: 'email', createdAt: '2026-04-07T15:00:00',
  },
  {
    id: 'i2', type: 'found', title: 'Blue North Face Backpack', description: 'Found near the entrance of the library. Contains some notebooks.',
    category: 'bags', location: 'Library', date: '2026-04-07T10:00:00', photos: [backpackImg],
    status: 'open', reporterId: 'u4', contactPreference: 'in_app', createdAt: '2026-04-07T10:30:00',
  },
  {
    id: 'i3', type: 'lost', title: 'Stevens ID Card', description: 'Lost my student ID somewhere between Palmer and the Student Center.',
    category: 'id_keys', location: 'Palmer Hall', date: '2026-04-06T16:00:00', photos: [idCardImg],
    status: 'potential_match', reporterId: 'u5', contactPreference: 'email', createdAt: '2026-04-06T17:00:00',
  },
  {
    id: 'i4', type: 'found', title: 'Student ID Card - Maria G.', description: 'Found a Stevens ID card on the campus quad near the fountain.',
    category: 'id_keys', location: 'Campus Quad', date: '2026-04-06T18:00:00', photos: [idCardImg],
    status: 'potential_match', reporterId: 'u2', contactPreference: 'in_app', createdAt: '2026-04-06T18:30:00',
  },
  {
    id: 'i5', type: 'lost', title: 'AirPods Pro Case', description: 'White AirPods Pro case with a small scratch on the back. Left in McLean 302.',
    category: 'electronics', location: 'McLean Hall', date: '2026-04-05T11:00:00', photos: [airpodsImg],
    status: 'claimed', reporterId: 'u1', contactPreference: 'email', createdAt: '2026-04-05T12:00:00',
  },
  {
    id: 'i6', type: 'found', title: 'TI-84 Calculator', description: 'Found in Edwin A. Stevens Hall, Room 122 after calc lecture.',
    category: 'electronics', location: 'Edwin A. Stevens Hall', date: '2026-04-05T09:00:00', photos: [calculatorImg],
    status: 'open', reporterId: 'u4', contactPreference: 'in_app', createdAt: '2026-04-05T09:30:00',
  },
  {
    id: 'i7', type: 'lost', title: 'Gray Hoodie', description: 'Stevens Engineering gray hoodie, size M. Left in Howe Center gym.',
    category: 'clothing', location: 'Howe Center', date: '2026-04-04T17:00:00', photos: [hoodieImg],
    status: 'returned', reporterId: 'u5', contactPreference: 'email', createdAt: '2026-04-04T18:00:00',
  },
  {
    id: 'i8', type: 'found', title: 'Set of Keys with Duck Keychain', description: 'Found a set of 3 keys with a rubber duck keychain on River Terrace bench.',
    category: 'id_keys', location: 'River Terrace', date: '2026-04-07T08:00:00', photos: [keysImg],
    status: 'open', reporterId: 'u2', contactPreference: 'in_app', createdAt: '2026-04-07T08:15:00',
  },
];

export const mockMatches: Match[] = [
  {
    id: 'm1', lostItemId: 'i3', foundItemId: 'i4', score: 92,
    reason: 'Same category (ID/Keys), found 200m away, 2 hours later',
    status: 'pending',
  },
];

export const mockClaims: Claim[] = [
  {
    id: 'c1', itemId: 'i5', claimerId: 'u4',
    verificationAnswers: { brand: 'Apple', uniqueMarks: 'Small scratch on the back', contents: 'AirPods Pro' },
    status: 'approved', reviewedBy: 'u2', createdAt: '2026-04-06T10:00:00',
  },
];

export const mockNotifications: Notification[] = [
  { id: 'n1', userId: 'u1', message: 'Your MacBook Pro listing has been posted.', type: 'system', read: true, createdAt: '2026-04-07T15:01:00' },
  { id: 'n2', userId: 'u5', message: 'Potential match found for your Stevens ID Card!', type: 'match', read: false, createdAt: '2026-04-06T18:35:00' },
  { id: 'n3', userId: 'u1', message: 'Your claim for AirPods Pro Case has been approved.', type: 'approval', read: false, createdAt: '2026-04-06T10:05:00' },
  { id: 'n4', userId: 'u5', message: 'Your Gray Hoodie has been marked as returned. 🎉', type: 'return', read: true, createdAt: '2026-04-05T14:00:00' },
];
