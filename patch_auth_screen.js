import fs from 'fs';
let code = fs.readFileSync('src/components/AuthScreen.tsx', 'utf8');

if (!code.includes('const [password, setPassword] = useState("");')) {
  code = code.replace(
    'const [phone, setPhone] = useState("+7");',
    'const [phone, setPhone] = useState("+7");\n  const [password, setPassword] = useState("");'
  );
}

code = code.replace(
  'await fastLoginWithPhone(phone);',
  'await fastLoginWithPhone(phone, password);'
);

const phoneInputBlock = `
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Ваш Номер телефона
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+7 (999) 000-00-00"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition font-medium"
                  />
                  <p className="text-[10px] mt-2 text-slate-400">
                    При вводе номера, который есть в базе данных, вход произойдет автоматически.
                  </p>
                </div>
`;

const phoneAndPasswordInputBlock = `
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Номер телефона
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+7 (999) 000-00-00"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Пароль (если установлен)
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ваш пароль"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition font-medium"
                  />
                </div>
`;

code = code.replace(phoneInputBlock, phoneAndPasswordInputBlock);

fs.writeFileSync('src/components/AuthScreen.tsx', code);
