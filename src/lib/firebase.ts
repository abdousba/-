import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, collection, getDoc, getDocs, addDoc, updateDoc, deleteDoc, getDocFromServer } from 'firebase/firestore';
import { Post, PostType, PostCategory, PostStatus } from '../types';
import firebaseConfig from '../firebase-applet-config.json';

// Safe require or check for firebase config
let firebaseApp;
let db: any = null;
let auth: any = null;
let isRealFirebase = false;

// Default sample posts for rich native preview
const INITIAL_POSTS: Post[] = [
  {
    id: "post_1",
    title: "بطاقة تعريف وطنية باسم سليماني أمين",
    description: "لقيت بطاقة تعريف وطنية بيومترية في باب الزوار قرب محطة الحافلات. يرجى من صاحبها التواصل معي بعد تأكيد اللقب والولاية الأصلية.",
    type: "found",
    category: "documents",
    wilaya: "الجزائر العاصمة (Algiers)",
    commune: "باب الزوار",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
    ownerId: "user_amin",
    ownerName: "أمين العاصمي",
    contactNumber: "0555123456",
    securityQuestion: "ما هو اللقب الكامل لرب الأسرة المكتوب في ظهر البطاقة؟",
    securityAnswer: "سليماني",
    status: "active",
    image: "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "post_2",
    title: "مفاتيح سيارة رونو كليو 4 ضائعة",
    description: "ضيعت سلسلة مفاتيح سيارة رونو سوداء في حومة الباهية (وهران) اليوم صباحا. أرجو ممن يجدها الاتصال بي، فبها مفاتيح المنزل أيضا.",
    type: "lost",
    category: "keys",
    wilaya: "وهران (Oran)",
    commune: "وسط المدينة",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
    ownerId: "user_faycal",
    ownerName: "فيصل الوهراني",
    contactNumber: "0661987654",
    securityQuestion: "ما هو لون ميدالية المفاتيح المرفقة بها؟",
    securityAnswer: "أحمر",
    status: "active",
    image: "https://images.unsplash.com/photo-1590402444587-438e652dfe5a?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "post_3",
    title: "هاتف Redmi Note 12 أسود مسترجع",
    description: "لقيت هاتف Redmi Note 12 في حافلة نقل الطلبة بقسنطينة. الهاتف محمي برمز قفل. من يثبت أنه له يتصل بي لتسليمه إياه.",
    type: "found",
    category: "phones",
    wilaya: "قسنطينة (Constantine)",
    commune: "الخروب",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
    ownerId: "user_krimo",
    ownerName: "عبد الكريم",
    contactNumber: "0772345678",
    securityQuestion: "ما هي الصورة الموجودة في خلفية شاشة الهاتف؟",
    securityAnswer: "كرة قدم",
    status: "active"
  }
];

// Load local database posts for fully dynamic demo if Firebase is not linked
const getLocalStoragePosts = (): Post[] => {
  const stored = localStorage.getItem('dz_lost_found_posts');
  if (stored) {
    try { return JSON.parse(stored); } catch (e) { return INITIAL_POSTS; }
  }
  localStorage.setItem('dz_lost_found_posts', JSON.stringify(INITIAL_POSTS));
  return INITIAL_POSTS;
};

const setLocalStoragePosts = (posts: Post[]) => {
  localStorage.setItem('dz_lost_found_posts', JSON.stringify(posts));
};

try {
  if (firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY") {
    if (!getApps().length) {
      firebaseApp = initializeApp(firebaseConfig);
    } else {
      firebaseApp = getApp();
    }
    db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
    auth = getAuth(firebaseApp);
    isRealFirebase = true;
    console.log("Firebase initialized successfully in community app.");
  } else {
    console.warn("Using high-performance local container database (LocalStorage fallback).");
  }
} catch (e) {
  console.warn("Firebase initialization error. Falling back to high-performance local database.", e);
}

// Ensure database connection is tested on boot if real Firebase is used
if (isRealFirebase && db) {
  const testConnection = async () => {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (error) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.error("Please check your Firebase configuration or network.");
      }
    }
  };
  testConnection();
}

// Error handling mechanism required by instruction
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || 'offline_user',
      email: auth?.currentUser?.email || 'offline_email',
      emailVerified: auth?.currentUser?.emailVerified || false,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// API helper functions
export async function createPost(postData: Omit<Post, 'id' | 'createdAt' | 'status'>) {
  const newId = "post_" + Date.now();
  const fullPost: Post = {
    ...postData,
    id: newId,
    createdAt: new Date().toISOString(),
    status: 'active'
  };

  if (isRealFirebase && db) {
    try {
      await addDoc(collection(db, 'posts'), fullPost);
      return fullPost;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'posts');
    }
  } else {
    // Save to Local DB
    const posts = getLocalStoragePosts();
    posts.unshift(fullPost);
    setLocalStoragePosts(posts);
    return fullPost;
  }
}

export async function getFilteredPosts(wilaya?: string, category?: string, type?: PostType) {
  if (isRealFirebase && db) {
    try {
      // Direct integration mapping query
      const postsSnapshot = await getDocs(collection(db, 'posts'));
      let list = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
      
      // Clientside fine-filtering to bypass index complexity on initial runs
      if (wilaya && wilaya !== 'all') {
        list = list.filter(p => p.wilaya === wilaya);
      }
      if (category && category !== 'all') {
        list = list.filter(p => p.category === category);
      }
      if (type) {
        list = list.filter(p => p.type === type);
      }
      return list.filter(p => p.status === 'active');
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'posts');
    }
  } else {
    // Local DB query engine
    let list = getLocalStoragePosts();
    if (wilaya && wilaya !== 'all' && wilaya !== '') {
      list = list.filter(p => p.wilaya.includes(wilaya) || wilaya.includes(p.wilaya));
    }
    if (category && category !== 'all' && category !== '') {
      list = list.filter(p => p.category === category);
    }
    if (type) {
      list = list.filter(p => p.type === type);
    }
    // Only return active posts for main feed, unless resolved posts are needed
    return list.filter(p => p.status === 'active');
  }
}

export async function togglePostStatus(postId: string, status: PostStatus) {
  if (isRealFirebase && db) {
    const docPath = `posts/${postId}`;
    try {
      await updateDoc(doc(db, 'posts', postId), { status });
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, docPath);
    }
  } else {
    const posts = getLocalStoragePosts();
    const index = posts.findIndex(p => p.id === postId);
    if (index !== -1) {
      posts[index].status = status;
      setLocalStoragePosts(posts);
      return true;
    }
    return false;
  }
}

// Offline active user helpers
export function getCurrentUser() {
  if (isRealFirebase && auth) {
    return auth.currentUser;
  }
  return {
    uid: "local_user_algeria_phone",
    displayName: "مستخدم جزائري",
    phoneNumber: "0666112233"
  };
}
