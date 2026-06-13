export interface UserProfile {
  uid: string;
  displayName: string;
  email: string | null;
  phoneNumber?: string;
  photoURL?: string;
}

export type PostType = 'lost' | 'found';
export type PostCategory = 'documents' | 'keys' | 'phones' | 'others';
export type PostStatus = 'active' | 'resolved';

export interface Post {
  id: string;
  title: string;
  description: string;
  type: PostType;
  category: PostCategory;
  wilaya: string;
  commune: string; // الحومة أو البلدية
  image?: string;
  createdAt: string; // ISO String or Firestore ServerTimestamp
  ownerId: string;
  ownerName: string;
  contactNumber?: string;
  securityQuestion?: string; // سؤال مأمن لإثبات الملكية قبل إظهار رقم الهاتف
  securityAnswer?: string;
  status: PostStatus;
}
