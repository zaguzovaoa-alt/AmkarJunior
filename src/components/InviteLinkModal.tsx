import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Link, Check, Send, Sparkles } from 'lucide-react';
import { useCRM } from '../context/CRMContext';

interface InviteLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InviteLinkModal: React.FC<InviteLinkModalProps> = ({ isOpen, onClose }) => {
  const { schoolName } = useCRM();
  const [copiedLink, setCopiedLink] = useState(false);

  const referralLink = `${window.location.origin}/join`;
  const shareText = `Приглашаю на занятия в футбольный клуб "${schoolName || 'АМКАР ЮНИОР'}"! Первая тренировка - бесплатно. Присоединяйтесь по ссылке: ${referralLink}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };
  
  const handleShareTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`, '_blank');
  };
  
  const handleShareWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
  };
  
  const handleShareVK = () => {
    window.open(`https://vk.com/share.php?url=${encodeURIComponent(referralLink)}&title=${encodeURIComponent(`Приглашаю в футбольный клуб ${schoolName || 'АМКАР ЮНИОР'}!`)}`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-100"
        >
          <div className="p-6 relative text-center pb-2">
            <button onClick={onClose} className="absolute right-4 top-4 p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <div className="w-16 h-16 bg-emerald-100 rounded-3xl mx-auto flex items-center justify-center rotate-3 mb-4 text-emerald-600 shadow-inner">
               <Sparkles className="w-8 h-8 drop-shadow-sm" />
            </div>
            <h2 className="font-extrabold text-slate-900 text-xl tracking-tight leading-tight">Пригласить<br/>в {schoolName || 'АМКАР ЮНИОР'}</h2>
            <p className="text-xs text-slate-500 mt-2 px-2">
              Отправьте реферальную ссылку знакомым для записи на пробную тренировку
            </p>
          </div>
          
          <div className="p-6 space-y-3">
            
            <button 
              onClick={handleCopyLink}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold rounded-2xl flex justify-center items-center space-x-2 transition-all shadow-md shadow-emerald-500/20 active:scale-95"
            >
              {copiedLink ? <Check className="w-5 h-5" /> : <Link className="w-5 h-5" />}
              <span>{copiedLink ? 'Ссылка скопирована!' : 'Скопировать ссылку'}</span>
            </button>
            
            <div className="grid grid-cols-2 gap-3 pt-2 w-full">
              <button 
                onClick={handleShareWhatsApp}
                className="w-full py-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] font-bold rounded-2xl flex flex-col justify-center items-center gap-1 transition text-xs border border-[#25D366]/20"
              >
                <div className="bg-[#25D366] text-white p-2 rounded-full mb-1">
                   <Send className="w-4 h-4" />
                </div>
                <span>WhatsApp</span>
              </button>
              
               <button 
                onClick={handleShareTelegram}
                className="w-full py-3 bg-[#0088cc]/10 hover:bg-[#0088cc]/20 text-[#0088cc] font-bold rounded-2xl flex flex-col justify-center items-center gap-1 transition text-xs border border-[#0088cc]/20"
              >
                <div className="bg-[#0088cc] text-white p-2 rounded-full mb-1">
                   <Send className="w-4 h-4 -translate-y-px -translate-x-px" />
                </div>
                <span>Telegram</span>
              </button>
            </div>

            <button 
                onClick={handleShareVK}
                className="w-full py-3 bg-[#0077FF]/10 hover:bg-[#0077FF]/20 text-[#0077FF] font-bold rounded-2xl flex justify-center items-center space-x-2 transition text-xs border border-[#0077FF]/20"
              >
                <Send className="w-4 h-4" />
                <span>Поделиться ВКонтакте</span>
            </button>
            
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
