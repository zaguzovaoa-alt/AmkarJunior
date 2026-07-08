import React, { useState } from "react";
import { useCRM } from "../context/CRMContext";
import { useAuth } from "../context/AuthContext";
import {
  Shield,
  Send,
  CheckCircle,
  User,
  Phone,
  Mail,
  Trophy,
  Calendar,
} from "lucide-react";
import { AmkarLogo } from "./AmkarLogo";
import heroImage from "../assets/images/kids_soccer_background_1780828846133.png";

export const RegistrationPage: React.FC = () => {
  const { schoolName, appendClients } = useCRM();
  const { fastLoginWithPhone } = useAuth();

  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentEmail, setParentEmail] = useState("");

  const [childSurname, setChildSurname] = useState("");
  const [childName, setChildName] = useState("");
  const [childBirthDate, setChildBirthDate] = useState("");

  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [photoAccepted, setPhotoAccepted] = useState(false);

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [password, setPassword] = useState("");
  const [isPasswordStep, setIsPasswordStep] = useState(false);
  const [createdClientId, setCreatedClientId] = useState<string | null>(null);
  const [newClientData, setNewClientData] = useState<any>(null);

  const [verifyingPhone, setVerifyingPhone] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [expectedCode, setExpectedCode] = useState("");


  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (
      !parentName ||
      !parentPhone ||
      !childSurname ||
      !childName ||
      !childBirthDate
    ) {
      setError("Пожалуйста, заполните все обязательные поля");
      return;
    }

    if (!privacyAccepted) {
      setError("Необходимо согласие с Политикой конфиденциальности");
      return;
    }

    if (!photoAccepted) {
      setError("Необходимо согласие на фотосъёмку");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/callcheck/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: parentPhone }),
      });
      const data = await res.json();
      if (data.status === "OK" && data.code) {
        setExpectedCode(data.code.toString());
        setVerifyingPhone(true);
      } else {
        setError(data.status_text || data.message || "Ошибка отправки звонка");
      }
    } catch (e: any) {
      setError("Ошибка сети при проверке номера");
    } finally {
      setSaving(false);
    }
  };

  
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
      id: `cl_${Date.now()}`,
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



  return (
    <div className="min-h-screen font-sans pb-20 relative bg-slate-50">
      <div
        className="fixed inset-0 z-0 bg-cover bg-center opacity-10 mix-blend-overlay"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="relative z-10">
        <header className="bg-white/80 border-b border-white/20 py-4 px-6 fixed top-0 w-full z-40 backdrop-blur-md shadow-sm">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AmkarLogo className="w-10 h-10" />
              <span className="font-extrabold tracking-tight text-slate-900 text-lg uppercase">
                {schoolName || "АМКАР ЮНИОР"}
              </span>
            </div>
          </div>
        </header>

        <section className="pt-32 pb-16 px-4">
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="text-center space-y-2 mb-8">
              <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto rotate-3 shadow-lg mb-2">
                <Shield className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Регистрация профиля
              </h1>
              <p className="text-sm text-slate-500">
                Заполните данные родителя и ребенка для доступа к расписанию и
                кабинету.
              </p>
            </div>

            
            
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

              <div className="text-center py-8 space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                  <Phone className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  Подтверждение номера
                </h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                  На номер <span className="font-bold text-slate-800">{parentPhone}</span> сейчас поступит звонок. Введите <b>последние 4 цифры</b> номера входящего вызова.
                </p>
                {error && (
                  <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100 text-center">
                    {error}
                  </div>
                )}
                <div className="max-w-xs mx-auto">
                  <input
                    type="text"
                    maxLength={4}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                    className="w-full text-center tracking-[1em] text-3xl font-black bg-slate-50 border border-slate-200 rounded-xl py-4 focus:outline-none focus:border-red-500"
                    placeholder="0000"
                  />
                  <button
                    onClick={finalizeRegistration}
                    disabled={verificationCode.length !== 4}
                    className="w-full mt-4 py-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black rounded-xl shadow-lg shadow-red-500/30 transition-all disabled:opacity-50"
                  >
                    Подтвердить
                  </button>
                  <button
                    onClick={() => setVerifyingPhone(false)}
                    className="w-full mt-2 py-3 text-sm font-bold text-slate-500 hover:text-slate-700 transition"
                  >
                    Отменить
                  </button>
                </div>
              </div>
            ) : submitted ? (

              <div className="text-center py-8 space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  Профиль создан!
                </h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                  Данные успешно загружены в систему. Теперь вы можете войти в
                  свой личный кабинет.
                </p>
                <a
                  href="/"
                  className="inline-block mt-4 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition"
                >
                  Войти в кабинет
                </a>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100 text-center">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide border-b pb-2">
                    Данные ребенка
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                        Фамилия
                      </label>
                      <div className="relative">
                        <Trophy className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={childSurname}
                          onChange={(e) => setChildSurname(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-slate-800 focus:outline-none focus:border-red-500"
                          placeholder="Напр: Иванов"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                        Имя
                      </label>
                      <div className="relative">
                        <Trophy className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={childName}
                          onChange={(e) => setChildName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-slate-800 focus:outline-none focus:border-red-500"
                          placeholder="Напр: Иван"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                      Дата рождения
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="date"
                        required
                        value={childBirthDate}
                        onChange={(e) => setChildBirthDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-slate-800 focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide border-b pb-2">
                    Контакты родителя
                  </h3>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                      Ваше полное имя
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={parentName}
                        onChange={(e) => setParentName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-slate-800 focus:outline-none focus:border-red-500"
                        placeholder="Напр: Иванов Петр Сергеевич"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                        Телефон (для входа)
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="tel"
                          required
                          value={parentPhone}
                          onChange={(e) => setParentPhone(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-slate-800 focus:outline-none focus:border-red-500"
                          placeholder="+7 (999) 000-00-00"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                        Email (необязательно)
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          value={parentEmail}
                          onChange={(e) => setParentEmail(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-slate-800 focus:outline-none focus:border-red-500"
                          placeholder="mail@example.com"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 space-y-4">
                  <div className="flex items-start space-x-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <input
                      type="checkbox"
                      id="reg-privacy"
                      checked={privacyAccepted}
                      onChange={(e) => setPrivacyAccepted(e.target.checked)}
                      className="mt-1 w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500 cursor-pointer flex-shrink-0"
                    />
                    <label
                      htmlFor="reg-privacy"
                      className="text-[11px] text-slate-500 leading-tight"
                    >
                      Я выражаю свое согласие с{" "}
                      <a
                        href="/privacy"
                        className="text-red-600 hover:text-red-700 underline font-medium"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Политикой конфиденциальности
                      </a>{" "}
                      и даю согласие на{" "}
                      <a
                        href="/safety"
                        className="text-red-600 hover:text-red-700 underline font-medium"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        обработку моих персональных данных
                      </a>.
                    </label>
                  </div>

                  <div className="flex items-start space-x-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <input
                      type="checkbox"
                      id="reg-photo"
                      checked={photoAccepted}
                      onChange={(e) => setPhotoAccepted(e.target.checked)}
                      className="mt-1 w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500 cursor-pointer flex-shrink-0"
                    />
                    <label
                      htmlFor="reg-photo"
                      className="text-[11px] text-slate-500 leading-tight"
                    >
                      Я даю свое{" "}
                      <a
                        href="/photo"
                        className="text-red-600 hover:text-red-700 underline font-medium"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        согласие на фотосъёмку
                      </a>{" "}
                      меня и моего ребенка.
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={!privacyAccepted || !photoAccepted || saving}
                    className="w-full py-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black rounded-xl shadow-lg shadow-red-500/30 flex items-center justify-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 disabled:shadow-none"
                  >
                    <Send className="w-5 h-5" />
                    <span>{saving ? "Проверка..." : "Создать профиль"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
