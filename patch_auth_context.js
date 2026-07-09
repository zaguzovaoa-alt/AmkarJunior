import fs from 'fs';
let code = fs.readFileSync('src/context/AuthContext.tsx', 'utf8');

code = code.replaceAll('throw new Error("PASSWORD_NOT_SET");', 'throw new Error("Логин или пароль не верный");');
code = code.replaceAll('setPhoneError("Пароль не установлен. Требуется подтверждение номера.");', 'setPhoneError("Логин или пароль не верный");');

fs.writeFileSync('src/context/AuthContext.tsx', code);
console.log("Patched AuthContext.tsx");
