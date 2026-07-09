import fs from 'fs';
let code = fs.readFileSync('src/components/StaffRegistrationPage.tsx', 'utf8');

code = code.replace(
  '      if (!auth.currentUser) {\n        await signInAnonymously(auth);\n      }',
  '      if (!auth.currentUser) {\n        try {\n          await signInAnonymously(auth);\n        } catch (e) {\n          console.warn("signInAnonymously failed, continuing:", e);\n        }\n      }'
);

fs.writeFileSync('src/components/StaffRegistrationPage.tsx', code);
console.log("Patched StaffRegistrationPage.tsx");
