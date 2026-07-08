import fs from 'fs';
let code = fs.readFileSync('src/components/AuthScreen.tsx', 'utf8');

const regex1 = /const \[expectedCode, setExpectedCode\] = useState\(""\);[\s\S]*?finally \{\n      setIsSubmitting\(false\);\n    \}\n  \};/;

const loginLogic = `const [checkId, setCheckId] = useState("");
  const [callPhonePretty, setCallPhonePretty] = useState("");

  const handleFastLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10 || !privacyAccepted) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await fastLoginWithPhone(phone, password);
    } catch (err: any) {
      if (err.message === "PASSWORD_NOT_SET") {
        try {
          const res = await fetch("/api/callcheck/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone }),
          });
          const data = await res.json();
          if (data.status === "OK" && data.check_id) {
            setCheckId(data.check_id);
            setCallPhonePretty(data.call_phone_pretty || data.call_phone);
            setVerifyingPhone(true);
          } else {
            setError(data.status_text || data.message || "Ошибка инициализации звонка");
          }
        } catch (e: any) {
          setError("Ошибка сети при проверке номера");
        }
      } else {
        setError(err.message === "PASSWORD_REQUIRED" ? "Требуется пароль" : err.message === "INVALID_PASSWORD" ? "Неверный пароль" : err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    let interval: any;
    if (verifyingPhone && checkId) {
      interval = setInterval(async () => {
        try {
          const res = await fetch("/api/callcheck/status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ check_id: checkId }),
          });
          const data = await res.json();
          if (data.status === "OK" && data.check_status === "401") {
            clearInterval(interval);
            // Confirmed!
            try {
              await fastLoginWithPhone(phone, password, true);
            } catch (err: any) {
              setError(err.message);
            }
          }
        } catch (e) {
          console.error(e);
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [verifyingPhone, checkId, phone, password, fastLoginWithPhone]);`;

code = code.replace(regex1, loginLogic);

const oldVerifyAndSet = /const handleVerifyAndSetPassword = async \(\) => \{[\s\S]*?finally \{\n      setIsSubmitting\(false\);\n    \}\n  \};/;
code = code.replace(oldVerifyAndSet, "");

const formRegex = /\{verifyingPhone \? \([\s\S]*?\) : \(/;
const newForm = `{verifyingPhone ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Smartphone className="w-8 h-8 animate-pulse" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  Ожидаем звонок
                </h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                  Для подтверждения номера <b>с вашего телефона</b> ({phone}) позвоните на бесплатный номер:
                </p>
                <div className="py-4">
                  <a href={"tel:" + callPhonePretty?.replace(/[^+\\d]/g, '')} className="text-2xl font-black text-emerald-600 tracking-wider">
                    {callPhonePretty}
                  </a>
                </div>
                <p className="text-xs text-slate-400">
                  Звонок будет сброшен (это бесплатно). Страница обновится автоматически.
                </p>
                {(error || phoneError) && (
                  <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100 text-center">
                    {error || phoneError}
                  </div>
                )}
                <div className="max-w-xs mx-auto space-y-3 pt-4">
                  <button
                    onClick={() => setVerifyingPhone(false)}
                    className="w-full py-3 text-sm font-bold text-slate-500 hover:text-slate-700 transition"
                  >
                    Отменить
                  </button>
                </div>
              </div>
            ) : (`;

code = code.replace(formRegex, newForm);

fs.writeFileSync('src/components/AuthScreen.tsx', code);
