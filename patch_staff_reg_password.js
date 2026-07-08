import fs from 'fs';
let code = fs.readFileSync('src/components/StaffRegistrationPage.tsx', 'utf8');

const verificationState = `
  const [password, setPassword] = useState("");
  const [isPasswordStep, setIsPasswordStep] = useState(false);
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);
`;

code = code.replace(
  /const \[saving, setSaving\] = useState\(false\);/,
  `const [saving, setSaving] = useState(false);\n${verificationState}`
);

const finalizeRegistrationOld = /const finalizeRegistration = async \(\) => \{[\s\S]*?setVerifyingPhone\(false\);\n  \};/;

const finalizeRegistrationNew = `
  const finalizeRegistration = async () => {
    if (verificationCode !== expectedCode) {
      setError("Неверный код");
      return;
    }

    setSaving(true);
    try {
      const idToSave = \`temp_\${Date.now()}_\${Math.random().toString(36).substring(2, 9)}\`;
      const payload = {
        fullName: fullName.trim(),
        email: email ? email.toLowerCase().trim() : null,
        phone: phone ? phone.trim() : null,
        role: internalRole,
        uid: idToSave,
        createdAt: Date.now(),
      };
      await setDoc(doc(db, "systemUsers", idToSave), payload);
      setCreatedUserId(idToSave);
      setVerifyingPhone(false);
      setIsPasswordStep(true);
    } catch (err: any) {
      console.error(err);
      setError("Ошибка при регистрации: " + err?.message);
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async () => {
    if (password.length < 6) {
      setError("Пароль должен быть не менее 6 символов");
      return;
    }
    setSaving(true);
    try {
      await setDoc(doc(db, "systemUsers", createdUserId!), { password }, { merge: true });
      if (phone) {
        await fastLoginWithPhone(phone, password);
        window.location.href = "/";
      }
      setSubmitted(true);
      setIsPasswordStep(false);
    } catch (err: any) {
      setError("Ошибка при сохранении пароля: " + err?.message);
    } finally {
      setSaving(false);
    }
  };
`;

code = code.replace(finalizeRegistrationOld, finalizeRegistrationNew);

const verificationUI = `
            {isPasswordStep ? (
              <div className="text-center py-8 space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                  <Shield className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  Создайте пароль
                </h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                  Придумайте пароль для входа в свой рабочий кабинет. Минимум 6 символов.
                </p>
                {error && (
                  <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100 text-center">
                    {error}
                  </div>
                )}
                <div className="max-w-xs mx-auto">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-center text-xl font-medium bg-slate-50 border border-slate-200 rounded-xl py-4 focus:outline-none focus:border-indigo-500"
                    placeholder="Пароль"
                  />
                  <button
                    onClick={savePassword}
                    disabled={password.length < 6 || saving}
                    className="w-full mt-4 py-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-black rounded-xl shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-50"
                  >
                    {saving ? "Сохранение..." : "Завершить регистрацию"}
                  </button>
                </div>
              </div>
            ) : verifyingPhone && !submitted ? (
`;

code = code.replace(/\{\s*verifyingPhone && !submitted \? \(/, verificationUI);

fs.writeFileSync('src/components/StaffRegistrationPage.tsx', code);
