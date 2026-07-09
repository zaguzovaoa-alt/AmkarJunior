import fs from 'fs';
let code = fs.readFileSync('src/components/AuthScreen.tsx', 'utf8');

code = code.replaceAll('PASSWORD_NOT_SET', 'Логин или пароль не верный');

fs.writeFileSync('src/components/AuthScreen.tsx', code);
console.log("Patched AuthScreen.tsx");
