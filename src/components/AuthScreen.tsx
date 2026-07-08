import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Smartphone, Loader2, Info } from "lucide-react";
import { AmkarLogo } from "./AmkarLogo";

import heroImage from "../assets/images/kids_soccer_background_1780828846133.png";

export const AuthScreen: React.FC = () => {
  const {
    fastLoginWithPhone,
    phoneError,
    loading,
  } = useAuth();

  const [phone, setPhone] = useState("+7");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  
  const [verifyingPhone, setVerifyingPhone] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
    const [checkId, setCheckId] = useState("");
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
          if (data.status === "OK" && String(data.check_status) === "401") {
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
  }, [verifyingPhone, checkId, phone, password, fastLoginWithPhone]);

  


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 font-sans text-slate-800 relative bg-slate-900">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center opacity-40 mix-blend-overlay"
        style={{ backgroundImage: `url(${heroImage})` }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl relative z-10"
      >
        <div className="bg-slate-900 p-8 text-center relative border-b border-white/10">
          <div className="mx-auto flex items-center justify-center mb-6 h-28 w-24">
            <AmkarLogo width="100%" height="100%" />
          </div>
          <h1 className="text-white text-2xl font-black uppercase tracking-tight">
            АМКАР ЮНИОР
          </h1>
          <p className="text-slate-400 text-sm mt-2 font-medium">
            Единая корпоративная система
          </p>
        </div>

        <div className="p-8 space-y-6">
          <div className="flex items-start space-x-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <input
              type="checkbox"
              id="privacy"
              checked={privacyAccepted}
              onChange={(e) => setPrivacyAccepted(e.target.checked)}
              className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
            />
            <label
              htmlFor="privacy"
              className="text-[11px] text-slate-500 leading-tight"
            >
              Я выражаю свое согласие с{" "}
              <a
                href="/privacy"
                className="text-emerald-600 hover:text-emerald-700 underline font-medium"
                target="_blank"
                rel="noopener noreferrer"
              >
                Политикой конфиденциальности
              </a>{" "}
              и даю согласие на{" "}
              <a
                href="/safety"
                className="text-emerald-600 hover:text-emerald-700 underline font-medium"
                target="_blank"
                rel="noopener noreferrer"
              >
                обработку моих персональных данных
              </a>.
            </label>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key="phone"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {verifyingPhone ? (
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
                  <a href={"tel:" + callPhonePretty?.replace(/[^+\d]/g, '')} className="text-2xl font-black text-emerald-600 tracking-wider">
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
            ) : (
              <form onSubmit={handleFastLogin} className="space-y-4">
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
                    Пароль (обязательно)
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ваш пароль"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition font-medium"
                  />
                  <p className="text-[10px] mt-2 text-slate-400">
                    При первом входе введите желаемый пароль (минимум 6 символов). Потребуется подтверждение по звонку.
                  </p>
                </div>
                {(error || phoneError) && (
                  <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl flex items-start space-x-2">
                    <Info className="w-4 h-4 shrink-0" />
                    <span>{error || phoneError}</span>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={
                    isSubmitting || phone.length < 10 || !privacyAccepted || password.length < 6
                  }
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl transition flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Войти в систему"
                  )}
                </button>
              </form>
            )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="bg-slate-50 py-4 px-6 border-t border-slate-100 flex items-center justify-center space-x-2">
          <Shield className="w-4 h-4 text-emerald-600" />
          <span className="text-xs text-slate-500 font-medium tracking-wide">
            Защищенное соединение
          </span>
        </div>
      </motion.div>
      <div className="mt-8 flex flex-col items-center gap-2">
        <a
          href="/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-slate-400 hover:text-slate-300 transition-colors uppercase tracking-wider font-semibold"
        >
          Политика конфиденциальности
        </a>
        <a
          href="/safety"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-slate-400 hover:text-slate-300 transition-colors uppercase tracking-wider font-semibold"
        >
          Обработка персональных данных
        </a>
      </div>
    </div>
  );
};
