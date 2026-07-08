import fs from 'fs';
let code = fs.readFileSync('src/context/AuthContext.tsx', 'utf8');

code = code.replace(
  /fastLoginWithPhone: \(phone: string\) => Promise<boolean>;/,
  'fastLoginWithPhone: (phone: string, password?: string) => Promise<boolean>;'
);

code = code.replace(
  /const fastLoginWithPhone = async \(phone: string\) => \{/,
  'const fastLoginWithPhone = async (phone: string, password?: string) => {'
);

const oldSystemCheck = `
      // Check systemUsers
      for (const p of phoneCandidates) {
        const q = query(collection(db, 'systemUsers'), where('phone', '==', p));
        const snap = await getDocs(q);
        if (!snap.empty) {
          found = true;
          matchedSnap = snap.docs[0];
          docRole = matchedSnap.data().role as UserRole;
          docName = matchedSnap.data().fullName || '';
          docId = matchedSnap.id;
          break;
        }
      }
`;

const newSystemCheck = `
      // Check systemUsers
      for (const p of phoneCandidates) {
        const q = query(collection(db, 'systemUsers'), where('phone', '==', p));
        const snap = await getDocs(q);
        if (!snap.empty) {
          matchedSnap = snap.docs[0];
          const data = matchedSnap.data();
          if (data.password) {
            if (!password) {
              setPhoneError("Требуется пароль");
              throw new Error("Password required");
            }
            if (data.password !== password) {
              setPhoneError("Неверный пароль");
              throw new Error("Invalid password");
            }
          }
          found = true;
          docRole = data.role as UserRole;
          docName = data.fullName || '';
          docId = matchedSnap.id;
          break;
        }
      }
`;

code = code.replace(oldSystemCheck, newSystemCheck);


const oldCoachesCheck = `
        // Check coaches
        for (const p of phoneCandidates) {
          const q = query(collection(db, 'coaches'), where('phone', '==', p));
          const snap = await getDocs(q);
          if (!snap.empty) {
            found = true;
            matchedSnap = snap.docs[0];
            docRole = 'trainer';
            docName = matchedSnap.data().name || '';
            docId = matchedSnap.id;
            break;
          }
        }
`;

const newCoachesCheck = `
        // Check coaches
        for (const p of phoneCandidates) {
          const q = query(collection(db, 'coaches'), where('phone', '==', p));
          const snap = await getDocs(q);
          if (!snap.empty) {
            matchedSnap = snap.docs[0];
            const data = matchedSnap.data();
            if (data.password) {
              if (!password) {
                setPhoneError("Требуется пароль");
                throw new Error("Password required");
              }
              if (data.password !== password) {
                setPhoneError("Неверный пароль");
                throw new Error("Invalid password");
              }
            }
            found = true;
            docRole = 'trainer';
            docName = data.name || '';
            docId = matchedSnap.id;
            break;
          }
        }
`;
code = code.replace(oldCoachesCheck, newCoachesCheck);

const oldClientsCheck = `
        // Check clients
        if (!found) {
          for (const p of phoneCandidates) {
            const q = query(collection(db, 'clients'), where('parentPhone', '==', p));
            const snap = await getDocs(q);
            if (!snap.empty) {
              found = true;
              matchedSnap = snap.docs[0];
              docRole = 'parent';
              docName = matchedSnap.data().parentName || '';
              docId = matchedSnap.id;
              break;
            }
          }
        }
`;

const newClientsCheck = `
        // Check clients
        if (!found) {
          for (const p of phoneCandidates) {
            const q = query(collection(db, 'clients'), where('parentPhone', '==', p));
            const snap = await getDocs(q);
            if (!snap.empty) {
              matchedSnap = snap.docs[0];
              const data = matchedSnap.data();
              if (data.password) {
                if (!password) {
                  setPhoneError("Требуется пароль");
                  throw new Error("Password required");
                }
                if (data.password !== password) {
                  setPhoneError("Неверный пароль");
                  throw new Error("Invalid password");
                }
              }
              found = true;
              docRole = 'parent';
              docName = data.parentName || '';
              docId = matchedSnap.id;
              break;
            }
          }
        }
`;
code = code.replace(oldClientsCheck, newClientsCheck);

fs.writeFileSync('src/context/AuthContext.tsx', code);
