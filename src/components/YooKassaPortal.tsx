import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { CreditCard, CheckCircle, ShieldCheck, Lock, AlertCircle, Sparkles } from 'lucide-react';

interface YooKassaPortalProps {
  clientId?: string;
  onClose: () => void;
}

export const YooKassaPortal: React.FC<YooKassaPortalProps> = ({ clientId, onClose }) => {
  const { clients, processPayment } = useCRM();
  
  // Selected client target
  const defaultClientId = clientId || 'cl1';
  const targetClient = clients.find(c => c.id === defaultClientId) || clients[0];

  // Tariff selection
  const tariffs = [
    { key: '12_sessions' as const, title: 'Абонемент на 12 занятий', price: 5400, popular: true, note: 'Самый выгодный тариф' },
    { key: '8_sessions' as const, title: 'Абонемент на 8 занятий', price: 4000, popular: false, note: 'Классический вариант' },
    { key: '4_sessions' as const, title: 'Абонемент на 4 занятия', price: 2100, popular: false, note: 'Для занятий по выходным' },
    { key: '1_session' as const, title: 'Разовая тренировка', price: 550, popular: false, note: 'Для проверки навыков' }
  ];

  const [selectedTariffKey, setSelectedTariffKey] = useState<'12_sessions' | '8_sessions' | '4_sessions' | '1_session'>('12_sessions');
  const selectedTariff = tariffs.find(t => t.key === selectedTariffKey)!;

  // Checkout steps
  const [step, setStep] = useState<'selection' | 'card_entry' | 'processing' | 'success'>('selection');
  
  // Card forms
  const [cardNumber, setCardNumber] = useState('2200 4821 3591 6002');
  const [cardExpiry, setCardExpiry] = useState('08/29');
  const [cardCvv, setCardCvv] = useState('115');

  const startPaymentProcessing = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('processing');
    
    // Simulating processing loop
    setTimeout(() => {
      // Call CRM context to persist paid subscription and move client to Active
      processPayment(targetClient.id, selectedTariff.key, selectedTariff.price);
      setStep('success');
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden border shadow-2xl text-left font-sans text-xs">
        
        {/* YooKassa/ЮKassa Branding bar */}
        <div className="bg-[#1a1f2c] px-6 py-5 text-white flex justify-between items-center">
          <div className="flex items-center space-x-2.5">
            <span className="h-6 w-6 rounded bg-emerald-500 flex items-center justify-center font-black text-white text-[10px]">
              Ю
            </span>
            <div>
              <div className="font-extrabold tracking-tight text-white text-base">ЮKassa</div>
              <p className="text-[10px] text-gray-400 font-medium">Безопасный шлюз оплаты АМКАР ЮНИОР</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white font-extrabold text-sm"
          >
            ✕
          </button>
        </div>

        {/* Dynamic Payment State Machine steps */}
        <div className="p-6 space-y-5">
          
          {step === 'selection' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-50 border rounded-2xl">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Плательщик:</p>
                <div className="font-extrabold text-slate-800 text-sm mt-0.5">{targetClient.parentName}</div>
                <p className="text-gray-500 font-medium mt-0.5">Получатель услуг: <strong className="text-slate-700">{targetClient.childSurname} {targetClient.childName}</strong></p>
              </div>

              <h3 className="font-extrabold text-slate-900 text-sm">Выберите подходящий тренировочный тариф</h3>
              
              <div className="space-y-2.5">
                {tariffs.map((tariff) => (
                  <label 
                    key={tariff.key}
                    onClick={() => setSelectedTariffKey(tariff.key)}
                    className={`p-3.5 border rounded-2xl cursor-pointer flex items-center justify-between transition-all select-none ${
                      selectedTariffKey === tariff.key 
                        ? 'border-emerald-600 bg-emerald-50/20' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3 text-left">
                      <input 
                        type="radio" 
                        name="tariff_choice" 
                        checked={selectedTariffKey === tariff.key}
                        onChange={() => {}}
                        className="accent-emerald-600 h-4 w-4"
                      />
                      <div>
                        <div className="font-bold text-slate-800 text-xs flex items-center space-x-2">
                          <span>{tariff.title}</span>
                          {tariff.popular && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[8px] font-bold uppercase">Популярный</span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-450 mt-0.5">{tariff.note}</p>
                      </div>
                    </div>

                    <div className="font-black font-mono text-slate-900 text-sm">
                      {tariff.price} ₽
                    </div>
                  </label>
                ))}
              </div>

              <div className="pt-2 border-t">
                <button 
                  onClick={() => setStep('card_entry')}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold transition text-xs uppercase tracking-wider"
                >
                  Перейти к вводу карты — {selectedTariff.price} ₽
                </button>
              </div>
            </div>
          )}

          {step === 'card_entry' && (
            <form onSubmit={startPaymentProcessing} className="space-y-4 text-left">
              <div className="p-3 bg-slate-50 rounded-2xl border flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase">Абонемент к оплате:</div>
                  <div className="font-extrabold text-slate-800 text-xs mt-0.5">{selectedTariff.title}</div>
                </div>
                <span className="font-black text-emerald-600 font-mono text-base">{selectedTariff.price} ₽</span>
              </div>

              <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-4 relative shadow-md">
                <div className="absolute top-4 right-4 text-[10px] font-mono tracking-widest text-slate-500 font-black">MIR / VISA / MASTERCARD</div>
                
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Номер кредитной карты</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full p-2.5 bg-slate-800/80 border border-slate-700/60 rounded-xl font-mono text-white text-sm tracking-widest focus:outline-none focus:border-emerald-500"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Срок действия</label>
                    <input 
                      required 
                      type="text" 
                      placeholder="MM/YY"
                      className="w-full p-2.5 bg-slate-800/80 border border-slate-700/60 rounded-xl font-mono text-white text-xs text-center focus:outline-none focus:border-emerald-500"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">CVC / CVV code</label>
                    <input 
                      required 
                      type="password" 
                      maxLength={3}
                      placeholder="***"
                      className="w-full p-2.5 bg-slate-800/80 border border-slate-700/60 rounded-xl font-mono text-white text-xs text-center tracking-widest focus:outline-none focus:border-emerald-500"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-gray-50 border border-gray-150 rounded-2xl text-[10px] text-gray-500 leading-normal flex items-start space-x-2">
                <Lock className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span>Все транзакции шифруются протоколом SSL/TLS и полностью соответствуют стандарту безопасности платежных карт PCI-DSS. Хост защищен ЮKassa.</span>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase"
                >
                  Оплатить {selectedTariff.price} ₽
                </button>
                <button 
                  type="button" 
                  onClick={() => setStep('selection')}
                  className="px-5 py-3 bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold"
                >
                  Назад
                </button>
              </div>
            </form>
          )}

          {step === 'processing' && (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
              <h4 className="font-bold text-slate-800 text-sm">Связь с банком-эмитентом...</h4>
              <p className="text-[10px] text-gray-500">Пожалуйста, не закрывайте окно оплаты. Проверяем остаток средств и 3D-Secure авторизацию.</p>
            </div>
          )}

          {step === 'success' && (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
              <div className="h-16 w-16 bg-emerald-100 border border-emerald-300 rounded-full flex items-center justify-center text-emerald-600 shadow-md">
                <CheckCircle className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-900 text-base">Оплата завершена успешно! 🎉</h4>
                <p className="text-xs text-gray-505 max-w-sm">
                  Абонемент для мальчика <strong>{targetClient.childSurname} {targetClient.childName}</strong> активирован в CRM футбольной школы. Менеджер извещен, а ребенку начислено <strong>{selectedTariff.key === '12_sessions' ? 12 : 8} тренировок</strong>.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border rounded-2xl text-[10px] text-gray-500 font-mono w-full max-w-sm">
                <div>Получатель: ЧОУ ДО "АМКАР ЮНИОР"</div>
                <div>Сумма: {selectedTariff.price} RUB</div>
                <div>Чек ФНС: №FP_5893120</div>
                <div>Дата: Сегодня</div>
              </div>

              <button 
                onClick={onClose}
                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition"
              >
                Вернуться к кабинетам
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
