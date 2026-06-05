import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Shield, Send, CheckCircle, User, Phone, Mail, Command } from 'lucide-react';
import { AmkarLogo } from './AmkarLogo';

export const StaffRegistrationPage: React.FC = () => {
  const params = new URLSearchParams(window.location.search);
  const invitedRoleRaw = params.get('role') || 'trainer';
  
  // Validate role
  let roleLabel = 'Тренер';
  let internalRole = 'trainer';
  
  if (invitedRoleRaw === 'manager') {
    roleLabel = 'Менеджер штаба';
    internalRole = 'manager';
  } else if (invitedRoleRaw === 'director') {
    roleLabel = 'Директор';
    internalRole = 'director';
  } else if (invitedRoleRaw === 'admin') {
    roleLabel = 'Администратор';
    internalRole = 'admin';
  }

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!fullName || (!phone && !email)) {
      setError('Пожалуйста, заполните ФИО и хотя бы один контакт для связи (телефон или email).');
      return;
    }
    
    if (!privacyAccepted) {
      setError('Необходимо согласие с Политикой конфиденциальности');
      return;
    }
    
    setSaving(true);
    
    try {
      const idToSave = `temp_${Date.now()}_${Math.random().toString(36).substring(2,9)}`;
      
      const payload = {
        fullName: fullName.trim(),
        email: email ? email.toLowerCase().trim() : null,
        phone: phone ? phone.trim() : null,
        role: internalRole,
        uid: idToSave,
        createdAt: Date.now()
      };

      await setDoc(doc(db, 'systemUsers', idToSave), payload);
      setSubmitted(true);
    } catch (err: any) {
      console.error(err);
      setError('Ошибка при регистрации: ' + err?.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <header className="bg-white border-b border-slate-100 py-4 px-6 fixed top-0 w-full z-40 bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AmkarLogo className="w-10 h-10" />
            <span className="font-extrabold tracking-tight text-slate-900 text-lg uppercase">АМКАР ЮНИОР : ШТАБ</span>
          </div>
          <a href="/" className="text-xs font-bold text-slate-500 hover:text-emerald-600 transition">Войти в портал</a>
        </div>
      </header>

      <section className="pt-32 pb-16 px-4">
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="text-center space-y-2 mb-8">
            <div className="w-16 h-16 bg-slate-900 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto rotate-3 shadow-lg mb-2">
              <Command className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Регистрация сотрудника</h1>
            <p className="text-sm text-slate-500">Вы приглашены на должность <span className="font-bold text-emerald-600">«{roleLabel}»</span>.</p>
          </div>

          {submitted ? (
            <div className="text-center py-8 space-y-4 animate-in fade-in zoom-in duration-300">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Профиль создан!</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Ваши данные успешно загружены в систему. Теперь вы можете войти в штабной кабинет, используя указанный телефон или email.
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
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Ваше полное ФИО</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      required 
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
                      placeholder="Напр: Иванов Петр Сергеевич"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Телефон (для входа по СМС)</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="tel" 
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
                        placeholder="+7 (999) 000-00-00"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Google Email (Для входа)</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="email" 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
                        placeholder="mail@gmail.com"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 space-y-4">
                <div className="flex items-start space-x-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <input 
                    type="checkbox" 
                    id="staff-privacy" 
                    checked={privacyAccepted}
                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                    className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="staff-privacy" className="text-[11px] text-slate-500 leading-tight">
                    Я выражаю свое согласие с <a href="/privacy" className="text-emerald-600 hover:text-emerald-700 underline font-medium" target="_blank" rel="noopener noreferrer">Политикой конфиденциальности</a> и даю согласие на обработку моих персональных данных. Место работы: АМКАР ЮНИОР.
                  </label>
                </div>
                
                <button 
                  type="submit"
                  disabled={!privacyAccepted || saving}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black rounded-xl shadow-lg shadow-emerald-500/30 flex items-center justify-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 disabled:shadow-none"
                >
                  <Send className="w-5 h-5" />
                  <span>{saving ? 'Сохранение...' : 'Завершить регистрацию'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};
