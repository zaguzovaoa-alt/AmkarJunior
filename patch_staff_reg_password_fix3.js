import fs from 'fs';
let code = fs.readFileSync('src/components/StaffRegistrationPage.tsx', 'utf8');

const savePasswordCode = `
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

  const handleSubmit = async (e: React.FormEvent) => {`;

code = code.replace(/const handleSubmit = async \(e: React.FormEvent\) => \{/, savePasswordCode);

fs.writeFileSync('src/components/StaffRegistrationPage.tsx', code);
