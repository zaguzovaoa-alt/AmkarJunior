import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CreditCard, Link, Check, Send } from 'lucide-react';
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
    { id: '1_session', title: 'Разовая тренировка', price: prices.price1 },
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
  
  const getShareLink = () => {
    const tariff = tariffs.find(t => t.id === selectedTariff)!;
    return `https://amkarjunior.ru/payment?client=${clientId}&tariff=${selectedTariff}&amount=${tariff.price}`;
  };
  
  const getShareText = () => {
    const tariff = tariffs.find(t => t.id === selectedTariff)!;
    return `Здравствуйте! Ссылка для оплаты услуг АМКАР ЮНИОР для ученика (${clientName}): ${tariff.title} (${tariff.price.toLocaleString('ru-RU')} ₽) - ${getShareLink()}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getShareLink()).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };
  
  const handleShareTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(getShareLink())}&text=${encodeURIComponent(`Оплата услуг АМКАР ЮНИОР: ${clientName}`)}`, '_blank');
  };
  
  const handleShareWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(getShareText())}`, '_blank');
  };
  
  const handleShareVK = () => {
    window.open(`https://vk.com/share.php?url=${encodeURIComponent(getShareLink())}&title=${encodeURIComponent(`Оплата услуг АМКАР ЮНИОР: ${clientName}`)}`, '_blank');
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
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex justify-between items-center ${
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
              
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={handleCopyLink}
                  className="py-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold rounded-xl flex justify-center items-center space-x-2 transition text-sm"
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Link className="w-4 h-4" />}
                  <span>{copiedLink ? 'Скопировано!' : 'Копировать'}</span>
                </button>
                
                <button 
                  onClick={handleShareWhatsApp}
                  className="py-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] font-bold rounded-xl flex justify-center items-center space-x-2 transition text-sm"
                >
                  <Send className="w-4 h-4" />
                  <span>WhatsApp</span>
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                 <button 
                  onClick={handleShareTelegram}
                  className="py-3 bg-[#0088cc]/10 hover:bg-[#0088cc]/20 text-[#0088cc] font-bold rounded-xl flex justify-center items-center space-x-2 transition text-sm"
                >
                  <Send className="w-4 h-4" />
                  <span>Telegram</span>
                </button>
                
                <button 
                  onClick={handleShareVK}
                  className="py-3 bg-[#0077FF]/10 hover:bg-[#0077FF]/20 text-[#0077FF] font-bold rounded-xl flex justify-center items-center space-x-2 transition text-sm"
                >
                  <Send className="w-4 h-4" />
                  <span>ВКонтакте</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

