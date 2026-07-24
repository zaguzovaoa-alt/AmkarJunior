import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User, signInAnonymously, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, setDoc, doc, getDoc, deleteDoc } from 'firebase/firestore';

export type UserRole = 'admin' | 'director' | 'manager' | 'trainer' | 'parent';

export const normalizePhoneNumber = (phone: string): string => {
  if (!phone) return "";
  let clean = phone.replace(/[^\d+]/g, '');
  if (clean.startsWith('8') && clean.length === 11) {
    clean = '+7' + clean.slice(1);
  }
  if (clean.startsWith('7') && clean.length === 11) {
    clean = '+' + clean;
  }
  if (!clean.startsWith('+') && clean.length === 10) {
    clean = '+7' + clean;
  }
  if (!clean.startsWith('+') && clean.length > 0) {
    clean = '+' + clean;
  }
  return clean;
};

export const extractLast10Digits = (phoneStr: string | null | undefined): string => {
  if (!phoneStr) return "";
  const digits = String(phoneStr).replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits;
};

export const phonesMatch = (phone1: string | null | undefined, phone2: string | null | undefined): boolean => {
  if (!phone1 || !phone2) return false;
  const d1 = extractLast10Digits(phone1);
  const d2 = extractLast10Digits(phone2);
  return d1.length === 10 && d1 === d2;
};

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
  fastLoginWithPhone: (phone: string, password?: string, forceSetPassword?: boolean) => Promise<boolean>;
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
    const storedVirtual = localStorage.getItem('virtual_user');
    if (storedVirtual) {
      try {
        const parsed = JSON.parse(storedVirtual);
        setUser({
          uid: parsed.uid,
          email: parsed.email || null,
          phoneNumber: parsed.phone || null,
          displayName: parsed.fullName || null,
          isAnonymous: true,
        } as any);
        setAppUser(parsed);
        setLoading(false);
      } catch (e) {
        console.error("Error loading virtual user:", e);
      }
    }

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await resolveAppUser(firebaseUser);
      } else {
        if (!localStorage.getItem('virtual_user')) {
          setUser(null);
          setAppUser(null);
        }
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (appUser) {
      localStorage.setItem('virtual_user', JSON.stringify(appUser));
    } else {
      localStorage.removeItem('virtual_user');
    }
  }, [appUser]);

  const resolveAppUser = async (u: User, optionalPhone?: string, explicitData?: Partial<AppUser>) => {
    try {
      const dbPhone = u.phoneNumber || optionalPhone;
      const activePhone = dbPhone ? normalizePhoneNumber(dbPhone) : null;
      
      let isCoach = false;
      let coachData: any = null;
      if (activePhone) {
        const coachCandidates = Array.from(new Set([
          activePhone,
          activePhone.replace('+7', '8'),
          activePhone.replace(/^\+7/, ''),
          dbPhone?.trim()
        ])).filter(Boolean);

        for (const p of coachCandidates) {
          const qCoach = query(collection(db, 'coaches'), where('phone', '==', p));
          const coachDocs = await getDocs(qCoach);
          if (!coachDocs.empty) {
            isCoach = true;
            coachData = coachDocs.docs[0].data();
            break;
          }
        }
      }
      
      let maxRole: UserRole | null = null;
      let existingPhoneDocs: any[] = [];
      const roleWeights: Record<string, number> = { admin: 5, director: 4, manager: 3, trainer: 2, parent: 1 };
      
      if (activePhone) {
        const userCandidates = Array.from(new Set([
          activePhone,
          activePhone.replace('+7', '8'),
          activePhone.replace(/^\+7/, ''),
          dbPhone?.trim()
        ])).filter(Boolean);

        for (const p of userCandidates) {
          const qPhone = query(collection(db, 'systemUsers'), where('phone', '==', p));
          const phoneSnap = await getDocs(qPhone);
          if (!phoneSnap.empty) {
            existingPhoneDocs = phoneSnap.docs;
            break;
          }
        }
        
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
        const cleanDataPhone = data.phone ? normalizePhoneNumber(data.phone) : '';
        const cleanActivePhone = activePhone ? normalizePhoneNumber(activePhone) : '';
        const rawPhoneClean = dbPhone ? normalizePhoneNumber(dbPhone) : '';

        const isAdmin = data.email === 'zaguzovsv@gmail.com' || 
                        u.email === 'zaguzovsv@gmail.com' || 
                        cleanDataPhone === '+79825885477' || 
                        cleanActivePhone === '+79825885477' ||
                        rawPhoneClean === '+79825885477';
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
          const sortedDocs = [...emailDocs.docs].sort((a, b) => {
            const roleA = (a.data().role as string) || 'parent';
            const roleB = (b.data().role as string) || 'parent';
            return (roleWeights[roleB] || 0) - (roleWeights[roleA] || 0);
          });
          const matchedDoc = sortedDocs[0];
          const { data: userData } = await reconcileData(matchedDoc.data() as AppUser);
          
          const newAppUser = { ...userData, uid: u.uid };
          await setDoc(docRef, newAppUser);
          
          for (const d of sortedDocs) {
            if (d.id !== u.uid) {
               await deleteDoc(doc(db, 'systemUsers', d.id));
            }
          }
          
          setAppUser(newAppUser);
          foundUser = true;
          return;
        }
      }

      if (!foundUser && activePhone) {
        const userCandidates = Array.from(new Set([
          activePhone,
          activePhone.replace('+7', '8'),
          activePhone.replace(/^\+7/, ''),
          dbPhone?.trim()
        ])).filter(Boolean);

        let phoneDocs: any = null;
        for (const p of userCandidates) {
          const qPhone = query(collection(db, 'systemUsers'), where('phone', '==', p));
          const snap = await getDocs(qPhone);
          if (!snap.empty) {
            phoneDocs = snap;
            break;
          }
        }

        if (!phoneDocs || phoneDocs.empty) {
          const sysSnap = await getDocs(collection(db, 'systemUsers'));
          const matched = sysSnap.docs.filter((d) => phonesMatch(d.data().phone, activePhone));
          if (matched.length > 0) {
            phoneDocs = { docs: matched, empty: false };
          }
        }

        if (phoneDocs && !phoneDocs.empty) {
          const sortedDocs = [...phoneDocs.docs].sort((a, b) => {
            const roleA = (a.data().role as string) || 'parent';
            const roleB = (b.data().role as string) || 'parent';
            return (roleWeights[roleB] || 0) - (roleWeights[roleA] || 0);
          });
          const matchedDoc = sortedDocs[0];
          const { data: userData } = await reconcileData(matchedDoc.data() as AppUser);
          
          const newAppUser = { ...userData, uid: u.uid };
          await setDoc(docRef, newAppUser);
          
          for (const d of sortedDocs) {
            if (d.id !== u.uid) {
               await deleteDoc(doc(db, 'systemUsers', d.id));
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
      
      const cleanActivePhone = activePhone ? normalizePhoneNumber(activePhone) : '';
      const rawPhoneClean = dbPhone ? normalizePhoneNumber(dbPhone) : '';
      const isAdminEmailOrPhone = u.email === 'zaguzovsv@gmail.com' || 
                                  cleanActivePhone === '+79825885477' || 
                                  rawPhoneClean === '+79825885477';

      let initialRole: UserRole = 'parent';
      if (isAdminEmailOrPhone) initialRole = 'admin';
      else if (isFirst) initialRole = 'director';
      else if (isCoach) initialRole = 'trainer';

      const newUser: AppUser = {
        uid: u.uid,
        email: u.email,
        phone: activePhone || dbPhone || null,
        fullName: explicitData?.fullName || (isCoach ? (coachData?.name || `Тренер ${activePhone || dbPhone}`) : (u.displayName || (activePhone || dbPhone ? `Пользователь ${activePhone || dbPhone}` : "Новый Пользователь"))),
        role: explicitData?.role || initialRole,
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
      
      const rawPhone = u.phoneNumber || optionalPhone;
      const cleanRawPhone = rawPhone ? normalizePhoneNumber(rawPhone) : '';
      const isAdmin = u.email === 'zaguzovsv@gmail.com' || cleanRawPhone === '+79825885477';

      setAppUser({
        uid: u.uid,
        email: u.email,
        phone: rawPhone || null,
        fullName: u.displayName || "Посетитель (Без БД)",
        role: isAdmin ? 'admin' : 'director', 
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
        if (check_status == 401) {
           return true; 
        }
        
        if (check_status == 400) {
           return false; // Still waiting
        }
      }
      
      throw new Error(data.status_text || "Invalid check status");
    } catch (err: any) {
      console.error(err);
      setPhoneError(err.message || "Ошибка проверки кода.");
      throw err;
    }
  };

  const fastLoginWithPhone = async (phone: string, password?: string, forceSetPassword?: boolean) => {
    setPhoneError(null);
    try {
      const cleanPhone = normalizePhoneNumber(phone);
      const digits10 = extractLast10Digits(phone);
      const isAdmin = cleanPhone === '+79825885477';
      const isTargetDirector = phonesMatch(cleanPhone, "+79082099991");

      let formatted = cleanPhone;
      if (cleanPhone.length === 12 && cleanPhone.startsWith('+7')) {
        formatted = `+7 (${cleanPhone.slice(2,5)}) ${cleanPhone.slice(5,8)}-${cleanPhone.slice(8,10)}-${cleanPhone.slice(10,12)}`;
      }
      
      const phoneCandidates = Array.from(new Set([
        phone.trim(), 
        cleanPhone, 
        phone.replace(/\s+/g, ''),
        cleanPhone.replace('+7', '8'),
        cleanPhone.replace(/^\+7/, ''),
        formatted,
        `8 (${cleanPhone.slice(2,5)}) ${cleanPhone.slice(5,8)}-${cleanPhone.slice(8,10)}-${cleanPhone.slice(10,12)}`,
        `8 ${cleanPhone.slice(2,5)} ${cleanPhone.slice(5,8)}-${cleanPhone.slice(8,10)}-${cleanPhone.slice(10,12)}`,
        `+7 ${cleanPhone.slice(2,5)} ${cleanPhone.slice(5,8)}-${cleanPhone.slice(8,10)}-${cleanPhone.slice(10,12)}`,
        `+7 ${cleanPhone.slice(2,5)} ${cleanPhone.slice(5,8)} ${cleanPhone.slice(8,10)} ${cleanPhone.slice(10,12)}`,
        `8 ${cleanPhone.slice(2,5)} ${cleanPhone.slice(5,8)} ${cleanPhone.slice(8,10)} ${cleanPhone.slice(10,12)}`,
        `+7${digits10}`,
        `8${digits10}`,
        `7${digits10}`,
        digits10
      ])).filter(Boolean);

      let found = false;
      let matchedSnap: any = null;
      let docRole: UserRole = 'parent';
      let docName = '';
      let docId = 'virtual_' + cleanPhone.replace(/[^\w]/g, '');
      let collectionName = '';

      let allMatchedDocs: { snap: any, collectionName: string, role: UserRole, name: string }[] = [];

      for (const p of phoneCandidates) {
        const qSys = query(collection(db, 'systemUsers'), where('phone', '==', p));
        const snapSys = await getDocs(qSys);
        if (!snapSys.empty) {
          for (const d of snapSys.docs) {
             allMatchedDocs.push({ snap: d, collectionName: 'systemUsers', role: (d.data().role as UserRole) || 'parent', name: d.data().fullName || '' });
          }
        }

        const qCoach = query(collection(db, 'coaches'), where('phone', '==', p));
        const snapCoach = await getDocs(qCoach);
        if (!snapCoach.empty) {
          for (const d of snapCoach.docs) {
             allMatchedDocs.push({ snap: d, collectionName: 'coaches', role: 'trainer', name: d.data().name || '' });
          }
        }

        const qClient = query(collection(db, 'clients'), where('parentPhone', '==', p));
        const snapClient = await getDocs(qClient);
        if (!snapClient.empty) {
          for (const d of snapClient.docs) {
             allMatchedDocs.push({ snap: d, collectionName: 'clients', role: 'parent', name: d.data().parentName || '' });
          }
        }
      }

      if (allMatchedDocs.length === 0) {
        // Fallback: search systemUsers, coaches, and clients by comparing digits
        const sysSnap = await getDocs(collection(db, 'systemUsers'));
        sysSnap.forEach((d) => {
          if (phonesMatch(d.data().phone, phone)) {
            allMatchedDocs.push({
              snap: d,
              collectionName: 'systemUsers',
              role: (d.data().role as UserRole) || (isTargetDirector ? 'director' : 'parent'),
              name: d.data().fullName || '',
            });
          }
        });

        const coachSnap = await getDocs(collection(db, 'coaches'));
        coachSnap.forEach((d) => {
          if (phonesMatch(d.data().phone, phone)) {
            allMatchedDocs.push({
              snap: d,
              collectionName: 'coaches',
              role: 'trainer',
              name: d.data().name || '',
            });
          }
        });

        const clientSnap = await getDocs(collection(db, 'clients'));
        clientSnap.forEach((d) => {
          if (phonesMatch(d.data().parentPhone, phone)) {
            allMatchedDocs.push({
              snap: d,
              collectionName: 'clients',
              role: 'parent',
              name: d.data().parentName || '',
            });
          }
        });
      }

      // If still not found and it's the target director phone, auto-provision Director user in systemUsers
      if (allMatchedDocs.length === 0 && isTargetDirector) {
        const dirDocId = 'dir_9082099991';
        const dirPayload = {
          uid: dirDocId,
          phone: '+79082099991',
          fullName: 'Директор',
          role: 'director' as UserRole,
          createdAt: Date.now(),
        };
        await setDoc(doc(db, 'systemUsers', dirDocId), dirPayload, { merge: true });
        const createdSnap = await getDoc(doc(db, 'systemUsers', dirDocId));
        allMatchedDocs.push({
          snap: createdSnap,
          collectionName: 'systemUsers',
          role: 'director',
          name: 'Директор',
        });
      }

      if (allMatchedDocs.length > 0) {
        found = true;
        
        // Sort by ID descending so newer profiles come first
        allMatchedDocs.sort((a, b) => b.snap.id.localeCompare(a.snap.id));
        let targetDoc = allMatchedDocs[0];
        
        // If it's target director phone, ensure role is director
        if (isTargetDirector && targetDoc.role !== 'director' && targetDoc.role !== 'admin') {
          targetDoc.role = 'director';
          if (targetDoc.snap) {
            await setDoc(doc(db, targetDoc.collectionName, targetDoc.snap.id), { role: 'director' }, { merge: true });
          }
        }

        if (!forceSetPassword && password) {
           const docWithMatchingPass = allMatchedDocs.find(d => d.snap.data().password === password);
           if (docWithMatchingPass) {
             targetDoc = docWithMatchingPass;
           } else {
             const matchingStaff = allMatchedDocs.find(d => 
                d.role !== 'parent' && 
                !d.snap.data().password && 
                (phoneCandidates.includes(password.trim()) || phonesMatch(password, phone))
             );
             if (matchingStaff) {
                targetDoc = matchingStaff;
             } else {
                 const docWithPass = allMatchedDocs.find(d => d.snap.data().password);
                 if (docWithPass) {
                     setPhoneError("Неверный пароль");
                     throw new Error("INVALID_PASSWORD");
                 } else {
                     setPhoneError("Логин или пароль не верный");
                     throw new Error("Логин или пароль не верный");
                 }
             }
           }
        } else if (!forceSetPassword && !password) {
           const docWithPass = allMatchedDocs.find(d => d.snap.data().password);
           if (docWithPass) {
              setPhoneError("Требуется пароль");
              throw new Error("PASSWORD_REQUIRED");
           } else {
              setPhoneError("Логин или пароль не верный");
              throw new Error("Логин или пароль не верный");
           }
        }

        matchedSnap = targetDoc.snap;
        docRole = targetDoc.role;
        docName = targetDoc.name;
        collectionName = targetDoc.collectionName;
        docId = matchedSnap.id;
        
        if (forceSetPassword && password) {
          for (const d of allMatchedDocs) {
             await setDoc(doc(db, d.collectionName, d.snap.id), { password }, { merge: true });
          }
        }
      } else {
        if (!isAdmin) {
          setPhoneError("Пользователь с таким номером не найден");
          return false;
        }
      }

      if (isAdmin) {
        docRole = 'admin';
        if (!docName) docName = 'Администратор';
      }

      try {
        const cred = await signInAnonymously(auth);
        await resolveAppUser(cred.user, phone, {
           fullName: docName || (isAdmin ? "Администратор" : "Пользователь"),
           role: docRole,
        });
        return true;
      } catch (authErr: any) {
        console.warn("signInAnonymously failed (using local virtual fallback):", authErr);
        
        const mockUser = {
          uid: docId,
          email: null,
          phoneNumber: cleanPhone,
          displayName: docName || (isAdmin ? "Администратор" : "Пользователь"),
          isAnonymous: true,
        } as any;
        
        setUser(mockUser);
        
        const fallbackAppUser: AppUser = {
          uid: docId,
          email: null,
          phone: cleanPhone,
          fullName: docName || (isAdmin ? "Администратор" : "Пользователь"),
          role: docRole,
          createdAt: Date.now()
        };
        
        try {
          await setDoc(doc(db, 'systemUsers', docId), fallbackAppUser, { merge: true });
        } catch (dbErr) {
          console.error("Failed to write virtual systemUser info to DB:", dbErr);
        }
        
        setAppUser(fallbackAppUser);
        return true;
      }
    } catch (err: any) {
      console.error(err);
      setPhoneError(err.message || "Ошибка авторизации.");
      return false;
    }
  };

  const logout = async () => {
    localStorage.removeItem('virtual_user');
    setUser(null);
    setAppUser(null);
    try {
      await signOut(auth);
    } catch (err) {
      console.error("SignOut error:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, appUser, loading, fastLoginWithPhone, sendPhoneCode, verifyPhoneCode, logout, phoneError }}>
      {children}
    </AuthContext.Provider>
  );
};
