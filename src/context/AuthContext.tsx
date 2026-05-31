import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup, signInAnonymously, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, setDoc, doc, getDoc } from 'firebase/firestore';

export type UserRole = 'director' | 'manager' | 'trainer' | 'parent';

export interface AppUser {
  uid: string;
  email?: string | null;
  phone?: string | null;
  fullName: string;
  role: UserRole;
  createdAt: number;
}

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  sendPhoneCode: (phone: string) => Promise<{ check_id: string; call_phone: string; call_phone_pretty: string }>;
  verifyPhoneCode: (check_id: string, phone: string) => Promise<boolean>;
  logout: () => Promise<void>;
  phoneError: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [phoneError, setPhoneError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await resolveAppUser(firebaseUser);
      } else {
        setAppUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const resolveAppUser = async (u: User, optionalPhone?: string) => {
    try {
      const docRef = doc(db, 'systemUsers', u.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as AppUser;
        if ((data.email === 'zaguzovsv@gmail.com' || u.email === 'zaguzovsv@gmail.com') && data.role !== 'director') {
          data.role = 'director';
          await setDoc(docRef, data, { merge: true });
        }
        // Sync anonymous user phone
        if (optionalPhone && !data.phone) {
          data.phone = optionalPhone;
          await setDoc(docRef, data, { merge: true });
        }
        setAppUser(data);
        return;
      }

      let foundUser = false;
      
      if (u.email) {
        const qEmail = query(collection(db, 'systemUsers'), where('email', '==', u.email));
        const emailDocs = await getDocs(qEmail);
        if (!emailDocs.empty) {
          const matchedDoc = emailDocs.docs[0];
          const userData = matchedDoc.data() as AppUser;
          const newAppUser = { ...userData, uid: u.uid };
          await setDoc(docRef, newAppUser);
          setAppUser(newAppUser);
          foundUser = true;
          return;
        }
      }

      const activePhone = u.phoneNumber || optionalPhone;
      if (!foundUser && activePhone) {
        const qPhone = query(collection(db, 'systemUsers'), where('phone', '==', activePhone));
        const phoneDocs = await getDocs(qPhone);
        if (!phoneDocs.empty) {
          const matchedDoc = phoneDocs.docs[0];
          const userData = matchedDoc.data() as AppUser;
          const newAppUser = { ...userData, uid: u.uid };
          await setDoc(docRef, newAppUser);
          setAppUser(newAppUser);
          foundUser = true;
          return;
        }
      }

      const allUsersSnap = await getDocs(query(collection(db, 'systemUsers')));
      const isFirst = allUsersSnap.empty;
      const isDirectorEmail = u.email === 'zaguzovsv@gmail.com';

      const newUser: AppUser = {
        uid: u.uid,
        email: u.email,
        phone: activePhone || null,
        fullName: u.displayName || (activePhone ? `Пользователь ${activePhone}` : "Новый Пользователь"),
        role: (isFirst || isDirectorEmail) ? 'director' : 'parent',
        createdAt: Date.now()
      };

      await setDoc(docRef, newUser);
      setAppUser(newUser);

    } catch (err) {
      console.error("Error resolving AppUser:", err);
      setAppUser({
        uid: u.uid,
        email: u.email,
        phone: u.phoneNumber || optionalPhone,
        fullName: u.displayName || "Посетитель (Без БД)",
        role: 'director', 
        createdAt: Date.now()
      });
    }
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error(err);
      alert("Ошибка входа Google: " + err.message);
    }
  };

  const sendPhoneCode = async (phone: string) => {
    setPhoneError(null);
    try {
      const response = await fetch('/api/callcheck/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await response.json();
      if (data.status === 'OK') {
        return data; // { check_id, call_phone, call_phone_pretty }
      } else {
        throw new Error(data.status_text || "Failed to initiate call");
      }
    } catch (err: any) {
      console.error(err);
      setPhoneError(err.message || "Ошибка отправки запроса.");
      throw err;
    }
  };

  const verifyPhoneCode = async (check_id: string, phone: string) => {
    setPhoneError(null);
    try {
      const response = await fetch('/api/callcheck/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ check_id })
      });
      const data = await response.json();
      if (data.status === 'OK' && data.check_status === "401") {
         const cred = await signInAnonymously(auth);
         await resolveAppUser(cred.user, phone);
         return true;
      }
      return false;
    } catch (err: any) {
      console.error(err);
      setPhoneError("Ошибка проверки статуса звонка.");
      throw err;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, appUser, loading, loginWithGoogle, sendPhoneCode, verifyPhoneCode, logout, phoneError }}>
      {children}
    </AuthContext.Provider>
  );
};
