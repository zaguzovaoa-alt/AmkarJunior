import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User, signInAnonymously, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, setDoc, doc, getDoc, deleteDoc } from 'firebase/firestore';

export type UserRole = 'admin' | 'director' | 'manager' | 'trainer' | 'parent';

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
  fastLoginWithPhone: (phone: string) => Promise<boolean>;
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
      if (firebaseUser) {
        setUser(firebaseUser);
        await resolveAppUser(firebaseUser);
      } else {
        setUser(null);
        setAppUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const resolveAppUser = async (u: User, optionalPhone?: string) => {
    try {
      const activePhone = u.phoneNumber || optionalPhone;
      
      let isCoach = false;
      let coachData: any = null;
      if (activePhone) {
        const qCoach = query(collection(db, 'coaches'), where('phone', '==', activePhone));
        const coachDocs = await getDocs(qCoach);
        if (!coachDocs.empty) {
          isCoach = true;
          coachData = coachDocs.docs[0].data();
        }
      }
      
      let maxRole: UserRole | null = null;
      let existingPhoneDocs: any[] = [];
      const roleWeights: Record<string, number> = { admin: 5, director: 4, manager: 3, trainer: 2, parent: 1 };
      
      if (activePhone) {
        const qPhone = query(collection(db, 'systemUsers'), where('phone', '==', activePhone));
        const phoneSnap = await getDocs(qPhone);
        existingPhoneDocs = phoneSnap.docs;
        
        for (const pd of existingPhoneDocs) {
          const r = pd.data().role as UserRole;
          if (!maxRole || (roleWeights[r] || 0) > (roleWeights[maxRole] || 0)) {
            maxRole = r;
          }
        }
      }

      const docRef = doc(db, 'systemUsers', u.uid);
      const docSnap = await getDoc(docRef);
      
      const reconcileData = async (data: AppUser) => {
        const isAdmin = data.email === 'zaguzovsv@gmail.com' || u.email === 'zaguzovsv@gmail.com' || data.phone === '+79825885477' || activePhone === '+79825885477';
        let updated = false;

        if (activePhone && !data.phone) {
          data.phone = activePhone;
          updated = true;
        }

        if (maxRole && (roleWeights[maxRole] || 0) > (roleWeights[data.role] || 0)) {
           data.role = maxRole;
           updated = true;
        }

        if (isAdmin && data.role !== 'admin') {
          data.role = 'admin';
          updated = true;
        } else if (!isAdmin && isCoach && data.role !== 'director' && data.role !== 'admin') {
          data.role = 'trainer';
          updated = true;
        } else if (!isAdmin && !isCoach && data.role === 'trainer') {
          // If they were trainer but no longer in coaches, but let's keep them as is to be safe
        }

        if (isCoach && (!data.fullName || data.fullName.startsWith('Пользователь'))) {
          data.fullName = coachData?.name || data.fullName;
          updated = true;
        }

        return { data, updated };
      };

      if (docSnap.exists()) {
        const { data, updated } = await reconcileData(docSnap.data() as AppUser);
        if (updated) await setDoc(docRef, data, { merge: true });
        setAppUser(data);
        
        for (const pd of existingPhoneDocs) {
           if (pd.id !== u.uid) await deleteDoc(doc(db, 'systemUsers', pd.id));
        }
        return;
      }

      let foundUser = false;
      
      if (u.email) {
        const qEmail = query(collection(db, 'systemUsers'), where('email', '==', u.email));
        const emailDocs = await getDocs(qEmail);
        if (!emailDocs.empty) {
          const roleWeights: Record<string, number> = { admin: 5, director: 4, manager: 3, trainer: 2, parent: 1 };
          const sortedDocs = [...emailDocs.docs].sort((a, b) => {
            const roleA = (a.data().role as string) || 'parent';
            const roleB = (b.data().role as string) || 'parent';
            return (roleWeights[roleB] || 0) - (roleWeights[roleA] || 0);
          });
          const matchedDoc = sortedDocs[0];
          const { data: userData, updated } = await reconcileData(matchedDoc.data() as AppUser);
          
          const newAppUser = { ...userData, uid: u.uid };
          await setDoc(docRef, newAppUser);
          
          for (const docSnap of sortedDocs) {
            if (docSnap.id !== u.uid) {
               await deleteDoc(doc(db, 'systemUsers', docSnap.id));
            }
          }
          
          setAppUser(newAppUser);
          foundUser = true;
          return;
        }
      }

      if (!foundUser && activePhone) {
        const qPhone = query(collection(db, 'systemUsers'), where('phone', '==', activePhone));
        const phoneDocs = await getDocs(qPhone);
        if (!phoneDocs.empty) {
          // Prioritize by role: admin > director > manager > trainer > parent
          const roleWeights: Record<string, number> = { admin: 5, director: 4, manager: 3, trainer: 2, parent: 1 };
          const sortedDocs = [...phoneDocs.docs].sort((a, b) => {
            const roleA = (a.data().role as string) || 'parent';
            const roleB = (b.data().role as string) || 'parent';
            return (roleWeights[roleB] || 0) - (roleWeights[roleA] || 0);
          });
          const matchedDoc = sortedDocs[0];
          const { data: userData } = await reconcileData(matchedDoc.data() as AppUser);
          
          const newAppUser = { ...userData, uid: u.uid };
          await setDoc(docRef, newAppUser);
          
          // Clean up old duplicated or matched ones
          for (const docSnap of sortedDocs) {
            if (docSnap.id !== u.uid) {
               await deleteDoc(doc(db, 'systemUsers', docSnap.id));
            }
          }
          
          setAppUser(newAppUser);
          foundUser = true;
          return;
        }
      }

      if (u.isAnonymous && !activePhone) {
        return;
      }

      const allUsersSnap = await getDocs(query(collection(db, 'systemUsers')));
      const isFirst = allUsersSnap.empty;
      const isAdminEmailOrPhone = u.email === 'zaguzovsv@gmail.com' || activePhone === '+79825885477';

      let initialRole: UserRole = 'parent';
      if (isAdminEmailOrPhone) initialRole = 'admin';
      else if (isFirst) initialRole = 'director';
      else if (isCoach) initialRole = 'trainer';

      const newUser: AppUser = {
        uid: u.uid,
        email: u.email,
        phone: activePhone || null,
        fullName: isCoach ? (coachData?.name || `Тренер ${activePhone}`) : (u.displayName || (activePhone ? `Пользователь ${activePhone}` : "Новый Пользователь")),
        role: initialRole,
        createdAt: Date.now()
      };

      await setDoc(docRef, newUser);
      setAppUser(newUser);

    } catch (err: any) {
      if (err.message?.includes('offline')) {
        console.warn("Offline mode active. Using fallback AppUser.");
      } else {
        console.error("Error resolving AppUser:", err);
      }
      setAppUser({
        uid: u.uid,
        email: u.email,
        phone: u.phoneNumber || optionalPhone,
        fullName: u.displayName || "Посетитель (Без БД)",
        role: (u.email === 'zaguzovsv@gmail.com' || (u.phoneNumber || optionalPhone) === '+79825885477') ? 'admin' : 'director', 
        createdAt: Date.now()
      });
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
      
      const check_status = (data.checks && data.checks[check_id]) 
        ? data.checks[check_id].check_status 
        : data.check_status;
        
      if (data.status === 'OK') {
        // 401 means Authorization Successful (call was made)
        if (check_status == 401) {
           try {
             const cred = await signInAnonymously(auth);
             await resolveAppUser(cred.user, phone);
             return true;
           } catch (authErr: any) {
             console.error("Firebase Auth Error:", authErr);
             if (authErr.code === 'auth/operation-not-allowed') {
               setPhoneError("Ошибка: Анонимная авторизация отключена в Firebase. Пожалуйста, включите её.");
             } else {
               setPhoneError("Ошибка Firebase Auth: " + authErr.message);
             }
             return false;
           }
        }
        
        // 400 means Waiting for Call
        if (check_status === 400) {
           return false; // Still waiting
        }
        
        if (check_status !== undefined) {
           setPhoneError(data.status_text || data.check_status_text || "Ошибка авторизации звонком.");
        }
        return false;
      }
      
      return false;
    } catch (err: any) {
      console.error("verifyPhoneCode top catch:", err);
      setPhoneError("Ошибка проверки статуса звонка: " + err.message);
      throw err;
    }
  };

  const fastLoginWithPhone = async (phone: string) => {
    setPhoneError(null);
    try {
      const qPhone = query(collection(db, 'systemUsers'), where('phone', '==', phone));
      const phoneDocs = await getDocs(qPhone);
      
      const qCoach = query(collection(db, 'coaches'), where('phone', '==', phone));
      const coachDocs = await getDocs(qCoach);
      
      if (phoneDocs.empty && coachDocs.empty) {
        setPhoneError("Номер телефона не найден в базе данных.");
        return false;
      }
      const cred = await signInAnonymously(auth);
      await resolveAppUser(cred.user, phone);
      return true;
    } catch (err: any) {
      console.error(err);
      setPhoneError(err.message || "Ошибка авторизации.");
      return false;
    }
  };

  const logout = async () => {
    setUser(null);
    setAppUser(null);
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, appUser, loading, fastLoginWithPhone, sendPhoneCode, verifyPhoneCode, logout, phoneError }}>
      {children}
    </AuthContext.Provider>
  );
};
