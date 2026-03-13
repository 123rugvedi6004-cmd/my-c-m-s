import { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'editor' | 'viewer';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  createdAt: Timestamp;
  bio?: string;
}

export type PostStatus = 'draft' | 'published';

export interface Post {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  status: PostStatus;
  category?: string;
  tags?: string[];
  imageUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  viewCount: number;
  likeCount: number;
  commentCount: number;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  text: string;
  parentId?: string;
  createdAt: Timestamp;
  likeCount: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'comment' | 'like' | 'mention' | 'follow';
  message: string;
  link?: string;
  read: boolean;
  createdAt: Timestamp;
}

export interface SavedPost {
  userId: string;
  postId: string;
  savedAt: Timestamp;
}

export interface Follow {
  followerId: string;
  followingId: string;
  createdAt: Timestamp;
}
