import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  CreditCard,
  CheckCircle,
  Copy,
  Check,
  Send,
  Users,
  DollarSign,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { useCRM } from "../context/CRMContext";
import { Client } from "../types";

interface ProcessPaymentModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ProcessPaymentModal: React.FC<ProcessPaymentModalProps> = ({
  client,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const {
    crmConfig,
    groups,
    accounts,
    updateClient,
    addFinanceRecord,
    schoolName,
  } = useCRM();

  const [step, setStep] = useState<"form" | "invite_success">("form");
  const [abonementType, setAbonementType] = useState<
    "12_sessions" | "8_sessions" | "4_sessions" | "1_session"
  >("8_sessions");
  const [amount, setAmount] = useState<number>(crmConfig.price8 || 4500);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [selectedAccount, setSelectedAccount] = useState<string>("acc_bank");
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [generatedInviteUrl, setGeneratedInviteUrl] = useState("");

  useEffect(() => {
    if (client) {
      setSelectedGroup(client.groupName || (groups[0]?.name || ""));
      setStep("form");
      setAbonementType("8_sessions");
      setAmount(crmConfig.price8 || 4500);
      if (accounts.length > 0) {
        setSelectedAccount(accounts[0].id);
      }
    }
  }, [client, groups, accounts, crmConfig]);

  const handleAbonementChange = (
    type: "12_sessions" | "8_sessions" | "4_sessions" | "1_session",
  ) => {
    setAbonementType(type);
    if (type === "12_sessions") setAmount(crmConfig.price12 || 6000);
    else if (type === "8_sessions") setAmount(crmConfig.price8 || 4500);
    else if (type === "4_sessions") setAmount(crmConfig.price4 || 2500);
    else if (type === "1_session") setAmount(crmConfig.price1 || 700);
  };

  if (!isOpen || !client) return null;

  const sessionsCount =
    abonementType === "12_sessions"
      ? 12
      : abonementType === "8_sessions"
      ? 8
      : abonementType === "4_sessions"
      ? 4
      : 1;

  const itemLabel =
    abonementType === "12_sessions"
      ? "Абонемент на 12 занятий"
      : abonementType === "8_sessions"
      ? "Абонемент на 8 занятий"
      : abonementType === "4_sessions"
      ? "Абонемент на 4 занятия"
      : "Разовая тренировка";

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;
    setIsSubmitting(true);

    try {
      const targetGroup = groups.find((g) => g.name === selectedGroup);
      const updatedSessionsLeft =
        (client.abonementSessionsLeft || 0) + sessionsCount;

      // 1. New payment record in client profile
      const newPayment = {
        id: `p_${Date.now()}`,
        date: paymentDate,
        amount: Number(amount),
        item: itemLabel,
        status: "Оплачено" as const,
      };
      const updatedPayments = [newPayment, ...(client.payments || [])];

      // 2. Expiration date (1 month from date)
      const exp = new Date(paymentDate);
      exp.setMonth(exp.getMonth() + 1);
      const expDateStr = exp.toISOString().split("T")[0];

      // 3. Update Client status and group
      await updateClient(client.id, {
        abonement: abonementType,
        abonementStatus: "Оплачено",
        status: "active",
        abonementTotalSessions: updatedSessionsLeft,
        abonementSessionsLeft: updatedSessionsLeft,
        abonementExpirationDate: expDateStr,
        groupName: selectedGroup || client.groupName || null,
        coachId: targetGroup?.coachId || client.coachId || null,
        coachName: targetGroup?.coachName || client.coachName || null,
        payments: updatedPayments,
      });

      // 4. Automatic Financial Accounting record
      const categoryName =
        abonementType === "1_session" ? "Разовые тренировки" : "Абонементы";
      await addFinanceRecord({
        type: "income",
        category: categoryName,
        amount: Number(amount),
        date: paymentDate,
        description: `Оплата ${itemLabel} (${client.childSurname} ${client.childName}, Группа: ${selectedGroup || "Не указана"})`,
        accountId: selectedAccount || "acc_bank",
        groupName: selectedGroup || undefined,
        isFixed: false,
      });

      // 5. Generate parent invite link
      const inviteUrl = `${window.location.origin}/register?phone=${encodeURIComponent(client.parentPhone || "")}&parent=${encodeURIComponent(client.parentName || "")}&child=${encodeURIComponent(client.childName || "")}`;
      setGeneratedInviteUrl(inviteUrl);

      // Move to invite link prompt step
      setStep("invite_success");
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Failed to process payment:", err);
      alert("Произошла ошибка при проведении оплаты.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard
      .writeText(generatedInviteUrl)
      .then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      })
      .catch((err) => console.error("Failed to copy:", err));
  };

  const shareText = `Здравствуйте, ${client.parentName}! Оплата занятий для ${client.childName} успешно подтверждена. Пожалуйста, перейдите по персональной ссылке для создания личного кабинета и доступа к расписанию: ${generatedInviteUrl}`;

  const handleShareWhatsApp = () => {
    const cleanPhone = (client.parentPhone || "").replace(/\D/g, "");
    window.open(
      `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(shareText)}`,
      "_blank",
    );
  };

  const handleShareTelegram = () => {
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(generatedInviteUrl)}&text=${encodeURIComponent(shareText)}`,
      "_blank",
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 my-8"
        >
          {step === "form" ? (
            /* FORM STEP */
            <form onSubmit={handleProcessPayment} className="p-6 space-y-5">
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                      Прием оплаты
                    </span>
                    <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Текущий статус: {client.abonementStatus || "Не оплачено"}
                    </span>
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                    Оформить абонемент & зачислить
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Ученик: <strong className="text-slate-800">{client.childSurname} {client.childName}</strong> (Родитель: {client.parentName})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 hover:bg-slate-100 rounded-full transition text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Select Abonement Type */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Выберите вид абонемента / разовой оплаты:
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    {
                      id: "12_sessions",
                      title: "12 занятий",
                      price: crmConfig.price12 || 6000,
                      badge: "Выгодно",
                    },
                    {
                      id: "8_sessions",
                      title: "8 занятий",
                      price: crmConfig.price8 || 4500,
                      badge: "Популярно",
                    },
                    {
                      id: "4_sessions",
                      title: "4 занятия",
                      price: crmConfig.price4 || 2500,
                    },
                    {
                      id: "1_session",
                      title: "1 разовая",
                      price: crmConfig.price1 || 700,
                    },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleAbonementChange(item.id as any)}
                      className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                        abonementType === item.id
                          ? "border-emerald-500 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-500/20"
                          : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                      }`}
                    >
                      {item.badge && (
                        <span className="absolute top-2 right-2 text-[9px] font-black bg-emerald-600 text-white px-1.5 py-0.5 rounded-md">
                          {item.badge}
                        </span>
                      )}
                      <div className="font-extrabold text-xs text-slate-900">
                        {item.title}
                      </div>
                      <div className="text-sm font-black text-emerald-700 mt-1">
                        {item.price.toLocaleString("ru-RU")} ₽
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Сумма к оплате (₽)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-full text-xs font-bold p-2.5 border rounded-xl outline-none focus:border-emerald-500 bg-white"
                      required
                    />
                    <DollarSign className="w-3.5 h-3.5 absolute right-3 top-3 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Дата платежа
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full text-xs font-bold p-2.5 border rounded-xl outline-none focus:border-emerald-500 bg-white"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Group Assignment */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Включить в группу</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    (Автоматическое зачисление)
                  </span>
                </label>
                <div className="relative">
                  <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="w-full text-xs font-bold p-2.5 border rounded-xl outline-none focus:border-emerald-500 bg-white"
                  >
                    <option value="">-- Без группы --</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.name}>
                        {g.name} (Тренер: {g.coachName})
                      </option>
                    ))}
                  </select>
                  <Users className="w-4 h-4 absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Payment Account */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Касса / Расчетный счет (Финансовый учет)
                </label>
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 border rounded-xl outline-none focus:border-emerald-500 bg-white"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.type === "bank" ? "Р/С Банк" : acc.type === "cash" ? "Касса" : "Эквайринг"})
                    </option>
                  ))}
                  {accounts.length === 0 && (
                    <option value="acc_bank">Расчетный счет (Банк)</option>
                  )}
                </select>
                <p className="text-[10px] text-emerald-600 font-medium mt-1">
                  ✓ Платёж будет автоматически учтен в отчете доходов клуба.
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-3 border-t flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl shadow-md text-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    "Проведение..."
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Провести оплату и зачислить</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* AUTOMATIC INVITE PROMPT STEP */
            <div className="p-6 text-center space-y-5 animate-scale-in">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl mx-auto flex items-center justify-center shadow-inner">
                <Sparkles className="w-8 h-8" />
              </div>

              <div>
                <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[10px] uppercase px-3 py-1 rounded-full">
                  ✓ Оплата успешно проведена
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-2">
                  Отправить ссылку родителю
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Платёж зачислен, статус клиента изменен на <strong>"Оплачено"</strong>, финансовая операция зафиксирована. Отправьте родителю ссылку для входа в персональную страницу.
                </p>
              </div>

              {/* Invite Link Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Персональная ссылка для {client.parentName}
                </div>
                <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                  <input
                    type="text"
                    readOnly
                    value={generatedInviteUrl}
                    className="w-full text-xs font-mono text-slate-700 bg-transparent outline-none truncate"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="p-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 text-slate-600 rounded-lg transition shrink-0 font-bold text-xs flex items-center gap-1"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Instant Share Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="w-full py-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] font-bold rounded-2xl flex items-center justify-center gap-2 transition text-xs border border-[#25D366]/20"
                >
                  <Send className="w-4 h-4" />
                  <span>В WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={handleShareTelegram}
                  className="w-full py-3 bg-[#0088cc]/10 hover:bg-[#0088cc]/20 text-[#0088cc] font-bold rounded-2xl flex items-center justify-center gap-2 transition text-xs border border-[#0088cc]/20"
                >
                  <Send className="w-4 h-4" />
                  <span>В Telegram</span>
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs transition shadow-md"
                >
                  Завершить
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
