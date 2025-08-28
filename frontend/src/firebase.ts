// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs
} from 'firebase/firestore';

// Firebase configuration
// Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "demo-key-replace-with-real",
  authDomain: "astramind-demo.firebaseapp.com",
  projectId: "astramind-demo",
  storageBucket: "astramind-demo.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// User roles
export type UserRole = 'admin' | 'user';

// User profile interface
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: Date;
  lastLoginAt: Date;
  apiKeysConfigured: string[];
  taskCount: number;
  plan: 'free' | 'premium';
}

// Task history interface
export interface TaskHistory {
  id: string;
  userId: string;
  taskType: 'voice-input' | 'youtube-summary' | 'job-search' | 'reminder' | 'text-to-speech' | 'task-execute';
  command?: string;
  status: 'success' | 'error' | 'pending';
  timestamp: Date;
  details: any;
}

// Authentication functions
export const authService = {
  // Sign up with email and password
  async signUp(email: string, password: string, displayName: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update display name
      await updateProfile(user, { displayName });
      
      // Create user profile in Firestore
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email || email,
        displayName: displayName,
        role: 'user', // Default role
        createdAt: new Date(),
        lastLoginAt: new Date(),
        apiKeysConfigured: [],
        taskCount: 0,
        plan: 'free'
      };
      
      await setDoc(doc(db, 'users', user.uid), userProfile);
      return user;
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update last login time
      await updateDoc(doc(db, 'users', user.uid), {
        lastLoginAt: new Date()
      });
      
      return user;
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Sign out
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Get current user profile
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      return null;
    } catch (error: any) {
      console.error('Error getting user profile:', error);
      return null;
    }
  },

  // Update user profile
  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), updates);
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Log task activity
  async logTaskActivity(userId: string, taskData: Omit<TaskHistory, 'id' | 'userId' | 'timestamp'>): Promise<void> {
    try {
      const taskHistory: Omit<TaskHistory, 'id'> = {
        userId,
        timestamp: new Date(),
        ...taskData
      };
      
      await addDoc(collection(db, 'taskHistory'), taskHistory);
      
      // Increment user task count
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const currentCount = userDoc.data().taskCount || 0;
        await updateDoc(userRef, { taskCount: currentCount + 1 });
      }
    } catch (error: any) {
      console.error('Error logging task activity:', error);
    }
  },

  // Get user task history
  async getUserTaskHistory(userId: string, limit: number = 50): Promise<TaskHistory[]> {
    try {
      const q = query(
        collection(db, 'taskHistory'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as TaskHistory));
    } catch (error: any) {
      console.error('Error getting task history:', error);
      return [];
    }
  },

  // Check if user has admin role
  async isAdmin(uid: string): Promise<boolean> {
    try {
      const profile = await this.getUserProfile(uid);
      return profile?.role === 'admin';
    } catch (error: any) {
      return false;
    }
  }
};

// Auth state observer
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
