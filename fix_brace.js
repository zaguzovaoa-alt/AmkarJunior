import fs from 'fs';
let code = fs.readFileSync('src/context/AuthContext.tsx', 'utf8');
code = code.replace(`        if (forceSetPassword && password) {
          // Update password on all matched docs to keep them in sync
          for (const d of allMatchedDocs) {
             await setDoc(doc(db, d.collectionName, d.snap.id), { password }, { merge: true });
          }
        }
      }
      } else {`, `        if (forceSetPassword && password) {
          // Update password on all matched docs to keep them in sync
          for (const d of allMatchedDocs) {
             await setDoc(doc(db, d.collectionName, d.snap.id), { password }, { merge: true });
          }
        }
      } else {`);
fs.writeFileSync('src/context/AuthContext.tsx', code);
