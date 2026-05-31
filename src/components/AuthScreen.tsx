import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Smartphone, Loader2, Info, PhoneCall } from 'lucide-react';
import { AmkarLogo } from './AmkarLogo';

export const AuthScreen: React.FC = () => {
  const { loginWithGoogle, sendPhoneCode, verifyPhoneCode, phoneError, loading } = useAuth();
  
  const [phoneMode, setPhoneMode] = useState(false);
  const [phone, setPhone] = useState('+7');
  
  const [callSession, setCallSession] = useState<{ check_id: string; call_phone: string; call_phone_pretty: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkInterval, setCheckInterval] = useState<number | null>(null);

  // Poll for status automatically when callSession exists
  useEffect(() => {
    if (!callSession) return;
    
    let isCancelled = false;
    const checkStatus = async () => {
      try {
        const verified = await verifyPhoneCode(callSession.check_id, phone);
        if (verified && !isCancelled) {
          if (checkInterval) clearInterval(checkInterval);
        }
      } catch (err) {
        // error handled in context
      }
    };

    const id = window.setInterval(checkStatus, 3000);
    setCheckInterval(id);

    return () => {
      isCancelled = true;
      clearInterval(id);
    };
  }, [callSession, phone]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) return;
    setIsSubmitting(true);
    try {
      const session = await sendPhoneCode(phone);
      setCallSession(session);
    } catch (err) {
      // handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualCheck = async () => {
    if (!callSession) return;
    setIsSubmitting(true);
    try {
      await verifyPhoneCode(callSession.check_id, phone);
    } catch (err) {
      // handled
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 font-sans text-slate-800">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl relative"
      >
        <div className="bg-slate-900 p-8 text-center relative border-b border-white/10">
          <div className="mx-auto flex items-center justify-center mb-6 h-28 w-24">
            <AmkarLogo width="100%" height="100%" />
          </div>
          <h1 className="text-white text-2xl font-black uppercase tracking-tight">АМКАР ЮНИОР</h1>
          <p className="text-slate-400 text-sm mt-2 font-medium">Единая корпоративная система</p>
        </div>

        <div className="p-8 space-y-6">
          <AnimatePresence mode="wait">
            {!phoneMode ? (
              <motion.div 
                key="social"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <button
                  onClick={loginWithGoogle}
                  className="w-full flex items-center justify-center space-x-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-3.5 px-4 rounded-xl font-bold transition shadow-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span>Войти через Google</span>
                </button>

                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase tracking-wider">или</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <button
                  onClick={() => setPhoneMode(true)}
                  className="w-full flex items-center justify-center space-x-3 bg-slate-900 border border-slate-900 hover:bg-slate-800 text-white py-3.5 px-4 rounded-xl font-bold transition shadow-sm"
                >
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                  <span>По номеру телефона</span>
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="phone"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {!callSession ? (
                  <form onSubmit={handleSendCode} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ваш Номер телефона</label>
                      <input 
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="+7 (999) 000-00-00"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition font-medium"
                      />
                    </div>
                    {phoneError && (
                      <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl flex items-start space-x-2">
                        <Info className="w-4 h-4 shrink-0" />
                        <span>{phoneError}</span>
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={isSubmitting || phone.length < 10}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl transition flex justify-center items-center disabled:opacity-50"
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Авторизоваться звонком'}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-6 text-center">
                    <PhoneCall className="w-12 h-12 text-blue-500 mx-auto animate-bounce" />
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg mb-2">Позвоните на номер</h3>
                      <p className="text-slate-500 text-sm mb-4">Для подтверждения авторизации сделайте бесплатный прозвон на номер ниже. Звонок будет автоматически сброшен, мы просто убедимся что номер ваш.</p>
                      <a href={`tel:${callSession.call_phone}`} className="inline-block bg-slate-100 text-slate-800 font-extrabold text-2xl py-3 px-6 rounded-xl border border-slate-200 tracking-wider hover:bg-white transition shadow-inner">
                        {callSession.call_phone_pretty}
                      </a>
                    </div>
                    <div className="flex items-center justify-center space-x-2 text-emerald-600 text-sm font-bold bg-emerald-50 p-3 rounded-lg">
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      <span>Ожидаем звонок...</span>
                    </div>

                    {phoneError && (
                      <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl flex items-start space-x-2 text-left">
                        <Info className="w-4 h-4 shrink-0" />
                        <span>{phoneError}</span>
                      </div>
                    )}
                    
                    <button
                      onClick={handleManualCheck}
                      disabled={isSubmitting}
                      className="w-full border shadow-sm border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3.5 rounded-xl transition flex justify-center items-center disabled:opacity-50"
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Проверить состояние вручную'}
                    </button>
                  </div>
                )}
                
                <button
                  onClick={() => { 
                    setPhoneMode(false); 
                    setCallSession(null);
                    if (checkInterval) clearInterval(checkInterval);
                  }}
                  className="w-full py-2 text-slate-500 text-sm font-semibold hover:text-slate-800 transition"
                >
                  Вернуться назад
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="bg-slate-50 py-4 px-6 border-t border-slate-100 flex items-center justify-center space-x-2">
          <Shield className="w-4 h-4 text-emerald-600" />
          <span className="text-xs text-slate-500 font-medium tracking-wide">Защищенное соединение</span>
        </div>
      </motion.div>
    </div>
  );
};
