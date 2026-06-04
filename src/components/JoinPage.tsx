import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { Trophy, CheckCircle, Shield, Phone, User, Calendar, Sparkles, Send, Target } from 'lucide-react';
import { AmkarLogo } from './AmkarLogo';
import { YooKassaPortal } from './YooKassaPortal';

export const JoinPage: React.FC = () => {
  const { schoolName, addLead, crmConfig } = useCRM();
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [childName, setChildName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [paymentModalClientId, setPaymentModalClientId] = useState<string | null>(null);

  // Auto-open payment modal if navigated to /payment
  React.useEffect(() => {
    if (window.location.pathname === '/payment') {
      const p = new URLSearchParams(window.location.search);
      const c = p.get('client');
      setPaymentModalClientId(c || 'cl_new_lead_stub');
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentName || !parentPhone) return;
    
    // Add as a new lead
    addLead({
      parentName,
      parentPhone,
      childName: childName || '',
      childSurname: '',
      childAge: 0,
      source: 'MAX',
      note: 'Заявка с лендинга /join на бесплатную тренировку'
    });
    
    setSubmitted(true);
  };
  
  const handleBuy = () => {
    // Just map to payment modal - in a real world, this would create a lead first
    setPaymentModalClientId('cl_new_lead_stub');
  };

  const prices = {
    price1: crmConfig?.price1 || 1500,
    price4: crmConfig?.price4 || 4000,
    price8: crmConfig?.price8 || 8000,
    price12: crmConfig?.price12 || 12000
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-emerald-500 selection:text-white pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 py-4 px-6 fixed top-0 w-full z-40 bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AmkarLogo className="w-10 h-10" />
            <span className="font-extrabold tracking-tight text-slate-900 text-lg uppercase">{schoolName || 'АМКАР ЮНИОР'}</span>
          </div>
          <a href="/" className="text-xs font-bold text-slate-500 hover:text-emerald-600 transition">Вход для клиентов</a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center space-x-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest mx-auto border border-emerald-100">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Набор открыт на сезон {new Date().getFullYear()}</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
            Первый шаг к <span className="text-emerald-600">большому футболу</span>
          </h1>
          <p className="text-slate-500 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Приглашаем мальчиков от 4 до 16 лет в академию футбольного клуба {schoolName || 'АМКАР ЮНИОР'}. 
            Профессиональные тренеры, современная методика и турниры.
          </p>
        </div>
      </section>

      {/* Two Column Layout for Form & Pricing */}
      <section className="px-4 max-w-6xl mx-auto grid md:grid-cols-2 gap-8 md:gap-12 mt-8">
        
        {/* Trial Request Form */}
        <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-[4rem] -z-0"></div>
          
          <div className="relative flex flex-col items-center text-center space-y-2 mb-8">
            <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center rotate-3 shadow-lg mb-2">
              <Target className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Пробная тренировка</h2>
            <p className="text-xs text-slate-500 max-w-[250px]">Оставьте заявку, и мы перезвоним для подбора удобного времени.</p>
          </div>

          {submitted ? (
            <div className="text-center py-8 space-y-4 animate-in fade-in zoom-in duration-300">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Заявка принята!</h3>
              <p className="text-sm text-slate-500">Наш менеджер свяжется с вами в ближайшее время по номеру {parentPhone}.</p>
              <button 
                onClick={() => setSubmitted(false)}
                className="mt-4 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Отправить еще одну
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Ваше имя (Родитель)</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    required 
                    value={parentName}
                    onChange={e => setParentName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition"
                    placeholder="Например: Иван Иванов"
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Телефон для связи</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="tel" 
                    required 
                    value={parentPhone}
                    onChange={e => setParentPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition"
                    placeholder="+7 (999) 000-00-00"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Имя ребенка (опционально)</label>
                <div className="relative">
                  <Trophy className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    value={childName}
                    onChange={e => setChildName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition"
                    placeholder="Например: Артем"
                  />
                </div>
              </div>

              <div className="flex items-start space-x-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <input 
                  type="checkbox" 
                  id="join-privacy" 
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="join-privacy" className="text-[11px] text-slate-500 leading-tight">
                  Я выражаю свое согласие с <a href="/privacy" className="text-emerald-600 hover:text-emerald-700 underline font-medium" target="_blank" rel="noopener noreferrer">Политикой конфиденциальности</a> и даю согласие на обработку моих персональных данных.
                </label>
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={!privacyAccepted}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black rounded-xl shadow-lg shadow-emerald-500/30 flex items-center justify-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 disabled:shadow-none"
                >
                  <Send className="w-4 h-4" />
                  <span>Отправить заявку</span>
                </button>
                <p className="text-center text-[9px] text-slate-400 mt-3 font-medium">
                  Нажимая кнопку, вы соглашаетесь с обработкой персональных данных.
                </p>
              </div>
            </form>
          )}
        </div>

        {/* Pricing / Subscriptions */}
        <div className="space-y-6 flex flex-col justify-center">
          <div className="text-center md:text-left space-y-2 mb-2">
             <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-slate-100 rounded-lg text-slate-600 font-bold text-[10px] uppercase tracking-wider">
               <Shield className="w-3.5 h-3.5" />
               <span>Официальная оплата онлайн</span>
             </div>
             <h2 className="text-2xl font-black text-slate-900 tracking-tight">Цены и абонементы</h2>
             <p className="text-xs text-slate-500">Для тех, кто уже в команде — выбирайте подходящий тариф, оплачивайте онлайн.</p>
          </div>

          <div className="space-y-4">
            
            {/* Tariff 1 */}
            <div className="bg-white border border-slate-200 hover:border-emerald-400 rounded-2xl p-5 flex items-center justify-between transition group shadow-sm hover:shadow-md cursor-pointer relative overflow-hidden" onClick={handleBuy}>
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm group-hover:text-emerald-700 transition">Абонемент на 12 занятий</h3>
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">Максимальная выгода</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-black text-slate-900 font-mono tracking-tighter">{prices.price12} ₽</div>
                <button className="text-[10px] font-bold text-emerald-600 uppercase mt-0.5 group-hover:underline">Купить</button>
              </div>
            </div>

            {/* Tariff 2 */}
            <div className="bg-white border border-slate-200 hover:border-emerald-400 rounded-2xl p-5 flex items-center justify-between transition group shadow-sm hover:shadow-md cursor-pointer relative overflow-hidden" onClick={handleBuy}>
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm group-hover:text-emerald-700 transition">Абонемент на 8 занятий</h3>
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">Дважды в неделю</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-black text-slate-900 font-mono tracking-tighter">{prices.price8} ₽</div>
                <button className="text-[10px] font-bold text-emerald-600 uppercase mt-0.5 group-hover:underline">Купить</button>
              </div>
            </div>

             {/* Tariff 3 */}
             <div className="bg-white border border-slate-200 hover:border-emerald-400 rounded-2xl p-5 flex items-center justify-between transition group shadow-sm hover:shadow-md cursor-pointer relative overflow-hidden" onClick={handleBuy}>
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm group-hover:text-emerald-700 transition">Абонемент на 4 занятия</h3>
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">Раз в неделю</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-black text-slate-900 font-mono tracking-tighter">{prices.price4} ₽</div>
                <button className="text-[10px] font-bold text-emerald-600 uppercase mt-0.5 group-hover:underline">Купить</button>
              </div>
            </div>

            {/* Default Trial / Base */}
             <div className="bg-transparent border border-slate-300 border-dashed rounded-2xl p-4 flex items-center justify-between opacity-80 hover:opacity-100 transition cursor-pointer" onClick={handleBuy}>
              <div>
                <h3 className="font-bold text-slate-700 text-xs">Разовая тренировка</h3>
              </div>
              <div className="text-right flex items-center space-x-3">
                <div className="text-sm font-black text-slate-700 font-mono tracking-tighter">{prices.price1} ₽</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Global payment modal attached to this view */}
      {paymentModalClientId && (
        <YooKassaPortal 
          clientId={paymentModalClientId} 
          onClose={() => setPaymentModalClientId(null)} 
        />
      )}
    </div>
  );
};
