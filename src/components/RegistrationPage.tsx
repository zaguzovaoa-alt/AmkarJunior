import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { Shield, Send, CheckCircle, User, Phone, Mail, Trophy, Calendar } from 'lucide-react';
import { AmkarLogo } from './AmkarLogo';

export const RegistrationPage: React.FC = () => {
  const { schoolName, appendClients } = useCRM();
  
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  
  const [childSurname, setChildSurname] = useState('');
  const [childName, setChildName] = useState('');
  const [childBirthDate, setChildBirthDate] = useState('');
  
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!parentName || !parentPhone || !childSurname || !childName || !childBirthDate) {
      setError('Пожалуйста, заполните все обязательные поля');
      return;
    }
    
    if (!privacyAccepted) {
      setError('Необходимо согласие с Политикой конфиденциальности');
      return;
    }
    
    const birthYear = parseInt(childBirthDate.split('-')[0]) || new Date().getFullYear();
    const childAge = new Date().getFullYear() - birthYear;
    
    // Create new client directly
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
      status: 'active' as const, // Or trial? Let's make it active with no abonement
      abonement: 'none' as const,
      abonementStatus: 'Нет абонемента' as const,
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
      notes: 'Регистрация через портал профиля',
    };
    
    appendClients([newClient]);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <header className="bg-white border-b border-slate-100 py-4 px-6 fixed top-0 w-full z-40 bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AmkarLogo className="w-10 h-10" />
            <span className="font-extrabold tracking-tight text-slate-900 text-lg uppercase">{schoolName || 'АМКАР ЮНИОР'}</span>
          </div>
          <a href="/" className="text-xs font-bold text-slate-500 hover:text-emerald-600 transition">Вход для клиентов</a>
        </div>
      </header>

      <section className="pt-32 pb-16 px-4">
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="text-center space-y-2 mb-8">
            <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto rotate-3 shadow-lg mb-2">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Регистрация профиля</h1>
            <p className="text-sm text-slate-500">Заполните данные родителя и ребенка для доступа к расписанию и кабинету.</p>
          </div>

          {submitted ? (
            <div className="text-center py-8 space-y-4 animate-in fade-in zoom-in duration-300">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Профиль создан!</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Данные успешно загружены в систему. Теперь вы можете войти в свой личный кабинет.
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
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide border-b pb-2">Данные ребенка</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Фамилия</label>
                    <div className="relative">
                      <Trophy className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        required 
                        value={childSurname}
                        onChange={e => setChildSurname(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-slate-800 focus:outline-none focus:border-red-500"
                        placeholder="Напр: Иванов"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Имя</label>
                    <div className="relative">
                      <Trophy className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        required 
                        value={childName}
                        onChange={e => setChildName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-slate-800 focus:outline-none focus:border-red-500"
                        placeholder="Напр: Иван"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Дата рождения</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="date" 
                      required 
                      value={childBirthDate}
                      onChange={e => setChildBirthDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-slate-800 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide border-b pb-2">Контакты родителя</h3>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Ваше полное имя</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      required 
                      value={parentName}
                      onChange={e => setParentName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-slate-800 focus:outline-none focus:border-red-500"
                      placeholder="Напр: Иванов Петр Сергеевич"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Телефон (для входа)</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="tel" 
                        required 
                        value={parentPhone}
                        onChange={e => setParentPhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-slate-800 focus:outline-none focus:border-red-500"
                        placeholder="+7 (999) 000-00-00"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Email (необязательно)</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="email" 
                        value={parentEmail}
                        onChange={e => setParentEmail(e.target.value)}
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
                    className="mt-1 w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500 cursor-pointer"
                  />
                  <label htmlFor="reg-privacy" className="text-[11px] text-slate-500 leading-tight">
                    Я выражаю свое согласие с <a href="/privacy" className="text-red-600 hover:text-red-700 underline font-medium" target="_blank" rel="noopener noreferrer">Политикой конфиденциальности</a> и даю согласие на обработку моих персональных данных.
                  </label>
                </div>
                
                <button 
                  type="submit"
                  disabled={!privacyAccepted}
                  className="w-full py-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black rounded-xl shadow-lg shadow-red-500/30 flex items-center justify-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 disabled:shadow-none"
                >
                  <Send className="w-5 h-5" />
                  <span>Создать профиль</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};
