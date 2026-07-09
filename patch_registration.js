import fs from 'fs';
let code = fs.readFileSync('src/components/RegistrationPage.tsx', 'utf8');

code = code.replace(
  '      if (!auth.currentUser) {\n        await signInAnonymously(auth);\n      }',
  '      if (!auth.currentUser) {\n        try {\n          await signInAnonymously(auth);\n        } catch (e) {\n          console.warn("signInAnonymously failed, continuing:", e);\n        }\n      }'
);

fs.writeFileSync('src/components/RegistrationPage.tsx', code);
console.log("Patched RegistrationPage.tsx");
