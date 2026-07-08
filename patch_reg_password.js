import fs from 'fs';
let code = fs.readFileSync('src/components/RegistrationPage.tsx', 'utf8');

const verificationState = `
  const [password, setPassword] = useState("");
  const [isPasswordStep, setIsPasswordStep] = useState(false);
  const [createdClientId, setCreatedClientId] = useState<string | null>(null);
  const [newClientData, setNewClientData] = useState<any>(null);
`;

code = code.replace(
  /const \[saving, setSaving\] = useState\(false\);/,
  `const [saving, setSaving] = useState(false);\n${verificationState}`
);

const finalizeRegistrationOld = /const finalizeRegistration = \(\) => \{[\s\S]*?setVerifyingPhone\(false\);\n  \};/;

const finalizeRegistrationNew = `
  const finalizeRegistration = () => {
    if (verificationCode !== expectedCode) {
      setError("Неверный код");
      return;
    }
    const birthYear =
      parseInt(childBirthDate.split("-")[0]) || new Date().getFullYear();
    const childAge = new Date().getFullYear() - birthYear;
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get("ref");

    const newClient = {
      id: \`cl_\${Date.now()}\`,
      parentName,
      parentPhone,
      parentEmail,
      childSurname,
      childName,
      childBirthDate,
      childBirthYear: birthYear,
      childAge,
      status: "active" as const,
      abonement: "none" as const,
      abonementStatus: "Нет абонемента" as const,
      abonementSessionsLeft: 0,
      groupName: null,
      coachId: null,
      coachName: null,
      medicalCertificateUrl: null,
      insuranceUrl: null,
      payments: [],
      attendance: [],
      progress: { technique: 0, tactics: 0, physical: 0, discipline: 0 },
      achievements: [],
      invitedBy: refCode || undefined,
      notes: "Регистрация через портал профиля",
    };

    setNewClientData(newClient);
    setVerifyingPhone(false);
    setIsPasswordStep(true);
  };

  const savePassword = async () => {
    if (password.length < 6) {
      setError("Пароль должен быть не менее 6 символов");
      return;
    }
    
    const clientToSave = { ...newClientData, password };
    appendClients([clientToSave]);
    
    // Automatically log the parent in after successful registration
    try {
      await fastLoginWithPhone(parentPhone, password);
      window.location.href = "/";
    } catch (e) {
      console.error(e);
    }

    setSubmitted(true);
    setIsPasswordStep(false);
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
                  Придумайте пароль для входа в свой личный кабинет. Минимум 6 символов.
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
                    className="w-full text-center text-xl font-medium bg-slate-50 border border-slate-200 rounded-xl py-4 focus:outline-none focus:border-red-500"
                    placeholder="Пароль"
                  />
                  <button
                    onClick={savePassword}
                    disabled={password.length < 6}
                    className="w-full mt-4 py-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black rounded-xl shadow-lg shadow-red-500/30 transition-all disabled:opacity-50"
                  >
                    Завершить регистрацию
                  </button>
                </div>
              </div>
            ) : verifyingPhone && !submitted ? (
`;

code = code.replace(/\{\s*verifyingPhone && !submitted \? \(/, verificationUI);

fs.writeFileSync('src/components/RegistrationPage.tsx', code);
