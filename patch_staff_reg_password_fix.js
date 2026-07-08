import fs from 'fs';
let code = fs.readFileSync('src/components/StaffRegistrationPage.tsx', 'utf8');

const finalizeRegistrationOld = /const finalizeRegistration = async \(\) => \{[\s\S]*?setVerifyingPhone\(false\);\n    \} catch \(err: any\) \{/;

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
    } catch (err: any) {`;

code = code.replace(finalizeRegistrationOld, finalizeRegistrationNew);

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

  const handleSendCode = async (e: React.FormEvent) => {`;

code = code.replace(/const handleSendCode = async \(e: React.FormEvent\) => \{/, savePasswordCode);

fs.writeFileSync('src/components/StaffRegistrationPage.tsx', code);
