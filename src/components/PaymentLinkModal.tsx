import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CreditCard, Link, Check } from 'lucide-react';
import { useCRM } from '../context/CRMContext';

interface PaymentLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
}

export const PaymentLinkModal: React.FC<PaymentLinkModalProps> = ({ isOpen, onClose, clientId, clientName }) => {
  const { crmConfig, sendPaymentLink } = useCRM();
  const [selectedTariff, setSelectedTariff] = useState<'1_session' | '4_sessions' | '8_sessions' | '12_sessions'>('12_sessions');
  const [copiedLink, setCopiedLink] = useState(false);

  // Fallback in case crmConfig is not ready immediately
  const prices = {
    price1: crmConfig?.price1 || 1500,
    price4: crmConfig?.price4 || 4000,
    price8: crmConfig?.price8 || 8000,
    price12: crmConfig?.price12 || 12000
  };

  const tariffs = [
    { id: '1_session', title: 'Разовая платная тренировка', price: prices.price1 },
    { id: '4_sessions', title: 'Абонемент на 4 занятия', price: prices.price4 },
    { id: '8_sessions', title: 'Абонемент на 8 занятий', price: prices.price8 },
    { id: '12_sessions', title: 'Абонемент на 12 занятий', price: prices.price12 }
  ];

  const handleSendViaCrm = () => {
    const tariff = tariffs.find(t => t.id === selectedTariff)!;
    sendPaymentLink(clientId, tariff.price, tariff.title);
    alert('Ссылка на оплату сформирована логикой CRM (имитация)! Оплата будет ожидать ответа от платежного шлюза.');
    onClose();
  };

  const handleCopyLink = () => {
    const tariff = tariffs.find(t => t.id === selectedTariff)!;
    const fakeLink = `${window.location.origin}/payment?client=${clientId}&tariff=${selectedTariff}&amount=${tariff.price}`;
    
    navigator.clipboard.writeText(fakeLink).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        >
          <div className="p-5 border-b flex justify-between items-center">
            <h2 className="font-extrabold text-slate-800 text-lg">Оплата: {clientName}</h2>
            <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition text-slate-500">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-sm text-slate-600 font-medium">Выберите тариф для оплаты:</p>
            
            <div className="space-y-2">
              {tariffs.map(t => (
                <div 
                  key={t.id}
                  onClick={() => setSelectedTariff(t.id as any)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition flex justify-between items-center ${
                    selectedTariff === t.id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 hover:border-emerald-200'
                  }`}
                >
                  <div className="font-bold text-slate-800 text-sm">{t.title}</div>
                  <div className="font-black text-emerald-600">{t.price.toLocaleString('ru-RU')} ₽</div>
                </div>
              ))}
            </div>

            <div className="pt-4 flex flex-col space-y-3">
              <button 
                onClick={handleSendViaCrm}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex justify-center items-center space-x-2 transition"
              >
                <CreditCard className="w-5 h-5" />
                <span>Отправить ссылку в ЛК родителя</span>
              </button>
              
              <button 
                onClick={handleCopyLink}
                className="w-full py-3.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-bold rounded-xl flex justify-center items-center space-x-2 transition"
              >
                {copiedLink ? <Check className="w-5 h-5" /> : <Link className="w-5 h-5" />}
                <span>{copiedLink ? 'Скопировано!' : 'Скопировать прямую ссылку'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
