import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  CheckCircle,
  Copy,
  Check,
  Send,
  Users,
  DollarSign,
  Sparkles,
  UserX,
  UserCheck,
  FileText,
  Plus,
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
    clients,
    groups,
    accounts,
    counterparties,
    financeCategories,
    updateClient,
    addFinanceRecord,
  } = useCRM();

  const [paymentMode, setPaymentMode] = useState<"client" | "unlinked">(
    client ? "client" : "unlinked",
  );
  const [selectedClientId, setSelectedClientId] = useState<string>(
    client?.id || "",
  );
  const [step, setStep] = useState<"form" | "invite_success" | "unlinked_success">("form");
  const [abonementType, setAbonementType] = useState<
    "12_sessions" | "8_sessions" | "4_sessions" | "1_session" | "subrent" | "custom"
  >("8_sessions");
  const [amount, setAmount] = useState<number>(crmConfig.price8 || 4500);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [selectedVenueId, setSelectedVenueId] = useState<string>("");
  const [selectedAccount, setSelectedAccount] = useState<string>("acc_bank");
  const [selectedCategory, setSelectedCategory] = useState<string>("Абонементы");
  const [customDescription, setCustomDescription] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [generatedInviteUrl, setGeneratedInviteUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const incomeCategories = financeCategories.filter((c) => c.type === "income");

  const activeClient =
    paymentMode === "client"
      ? clients.find((c) => c.id === selectedClientId) || client
      : null;

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setStep("form");
      setCustomDescription("");
      if (client) {
        setPaymentMode("client");
        setSelectedClientId(client.id);
        const initGroupName = client.groupName || groups[0]?.name || "";
        setSelectedGroup(initGroupName);
        const initGroupObj = groups.find((g) => g.name === initGroupName);
        setSelectedVenueId(initGroupObj?.venueId || "");
      } else {
        setPaymentMode("unlinked");
        setSelectedClientId("");
        setSelectedGroup("");
        setSelectedVenueId("");
      }
      setAbonementType("8_sessions");
      setAmount(crmConfig.price8 || 4500);
      setSelectedCategory(incomeCategories[0]?.name || "Абонементы");
      if (accounts.length > 0) {
        setSelectedAccount(accounts[0].id);
      }
    }
  }, [client, isOpen]);

  const handleAbonementChange = (
    type:
      | "12_sessions"
      | "8_sessions"
      | "4_sessions"
      | "1_session"
      | "subrent"
      | "custom",
  ) => {
    setAbonementType(type);
    if (type === "12_sessions") {
      setAmount(crmConfig.price12 || 6000);
      setSelectedCategory("Абонементы");
    } else if (type === "8_sessions") {
      setAmount(crmConfig.price8 || 4500);
      setSelectedCategory("Абонементы");
    } else if (type === "4_sessions") {
      setAmount(crmConfig.price4 || 2500);
      setSelectedCategory("Абонементы");
    } else if (type === "1_session") {
      setAmount(crmConfig.price1 || 700);
      setSelectedCategory("Разовые тренировки");
    } else if (type === "subrent") {
      setPaymentMode("unlinked");
      setAmount(0);
      const subrentCat = incomeCategories.find(
        (c) =>
          c.id === "cat_in_subrent" ||
          c.name.toLowerCase().includes("сдача площад") ||
          c.name.toLowerCase().includes("аренд"),
      );
      setSelectedCategory(subrentCat?.name || "Сдача площадок в аренду");
    }
  };

  if (!isOpen) return null;

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
          : abonementType === "1_session"
            ? "Разовая тренировка"
            : abonementType === "subrent"
              ? "Сдача площадки в аренду"
              : selectedCategory || "Ручное поступление";

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!amount || Number(amount) <= 0) {
      setErrorMsg("Укажите сумму больше 0 ₽");
      return;
    }

    if (paymentMode === "client" && !activeClient) {
      setErrorMsg("Выберите игрока или переключитесь в режим «Без привязки к игроку»");
      return;
    }

    setIsSubmitting(true);

    try {
      if (paymentMode === "unlinked" || !activeClient) {
        const categoryName =
          selectedCategory ||
          (abonementType === "1_session" ? "Разовые тренировки" : "Абонементы");
        const targetGroupUnlinked = groups.find(
          (g) => g.name === selectedGroup,
        );
        const resolvedVenueIdUnlinked =
          selectedVenueId || targetGroupUnlinked?.venueId || undefined;
        const resolvedVenueNameUnlinked = resolvedVenueIdUnlinked
          ? counterparties.find((c) => c.id === resolvedVenueIdUnlinked)?.name
          : undefined;
        const descText =
          customDescription.trim() ||
          `${itemLabel}${resolvedVenueNameUnlinked ? ` (площадка «${resolvedVenueNameUnlinked}»)` : selectedGroup ? ` (Группа: ${selectedGroup})` : " (без привязки к игроку)"}`;

        await addFinanceRecord({
          type: "income",
          category: categoryName,
          amount: Number(amount),
          date: paymentDate,
          targetMonth: paymentDate.substring(0, 7),
          description: descText,
          accountId: selectedAccount || "acc_bank",
          groupName: selectedGroup || undefined,
          counterpartyId: resolvedVenueIdUnlinked,
          isFixed: false,
        });

        setStep("unlinked_success");
        if (onSuccess) onSuccess();
      } else {
        const targetGroup = groups.find((g) => g.name === selectedGroup);
        const updatedSessionsLeft =
          (activeClient.abonementSessionsLeft || 0) +
          (abonementType === "custom" || abonementType === "subrent"
            ? 0
            : sessionsCount);

        const newPayment = {
          id: `p_${Date.now()}`,
          date: paymentDate,
          amount: Number(amount),
          item: customDescription.trim() || itemLabel,
          status: "Оплачено" as const,
        };
        const updatedPayments = [newPayment, ...(activeClient.payments || [])];

        const exp = new Date(paymentDate);
        exp.setMonth(exp.getMonth() + 1);
        const expDateStr = exp.toISOString().split("T")[0];

        const clientUpdates: Record<string, any> = {
          payments: updatedPayments,
          groupName: selectedGroup || activeClient.groupName || null,
          coachId: targetGroup?.coachId || activeClient.coachId || null,
          coachName: targetGroup?.coachName || activeClient.coachName || null,
        };

        if (abonementType !== "custom" && abonementType !== "subrent") {
          clientUpdates.abonement = abonementType;
          clientUpdates.abonementStatus = "Оплачено";
          clientUpdates.status = "active";
          clientUpdates.abonementTotalSessions = updatedSessionsLeft;
          clientUpdates.abonementSessionsLeft = updatedSessionsLeft;
          clientUpdates.abonementExpirationDate = expDateStr;
        }

        await updateClient(activeClient.id, clientUpdates);

        const categoryName =
          selectedCategory ||
          (abonementType === "1_session" ? "Разовые тренировки" : "Абонементы");
        const resolvedVenueIdClient =
          selectedVenueId || targetGroup?.venueId || undefined;
        await addFinanceRecord({
          type: "income",
          category: categoryName,
          amount: Number(amount),
          date: paymentDate,
          targetMonth: paymentDate.substring(0, 7),
          description:
            customDescription.trim() ||
            `Оплата ${itemLabel} (${activeClient.childSurname} ${activeClient.childName}, Группа: ${selectedGroup || "Не указана"})`,
          accountId: selectedAccount || "acc_bank",
          groupName: selectedGroup || undefined,
          counterpartyId: resolvedVenueIdClient,
          clientId: activeClient.id,
          clientName: `${activeClient.childSurname} ${activeClient.childName}`.trim(),
          isFixed: false,
        });

        const inviteUrl = `${window.location.origin}/register?phone=${encodeURIComponent(activeClient.parentPhone || "")}&parent=${encodeURIComponent(activeClient.parentName || "")}&child=${encodeURIComponent(activeClient.childName || "")}`;
        setGeneratedInviteUrl(inviteUrl);

        setStep("invite_success");
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      console.error("Failed to process payment:", err);
      setErrorMsg("Произошла ошибка при проведении оплаты.");
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

  const shareText = activeClient
    ? `Здравствуйте, ${activeClient.parentName}! Оплата занятий для ${activeClient.childName} успешно подтверждена. Пожалуйста, перейдите по персональной ссылке для создания личного кабинета и доступа к расписанию: ${generatedInviteUrl}`
    : "";

  const handleShareWhatsApp = () => {
    if (!activeClient) return;
    const cleanPhone = (activeClient.parentPhone || "").replace(/\D/g, "");
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
            <form onSubmit={handleProcessPayment} className="p-6 space-y-4">
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                      Прием дохода / оплаты
                    </span>
                    {paymentMode === "client" && activeClient && (
                      <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Статус: {activeClient.abonementStatus || "Не оплачено"}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                    {paymentMode === "unlinked"
                      ? "Внести доход без привязки к игроку"
                      : "Оформить абонемент и зачислить доход"}
                  </h2>
                  {paymentMode === "client" && activeClient ? (
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Ученик:{" "}
                      <strong className="text-slate-800">
                        {activeClient.childSurname} {activeClient.childName}
                      </strong>{" "}
                      (Родитель: {activeClient.parentName})
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Прямое зачисление в кассу / на расчетный счет (БДДС и P&L)
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 hover:bg-slate-100 rounded-full transition text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mode Switcher: With Player vs Without Player */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setPaymentMode("unlinked")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    paymentMode === "unlinked"
                      ? "bg-white text-emerald-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>Без привязки к игроку</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMode("client");
                    if (!selectedClientId && (client?.id || clients[0]?.id)) {
                      setSelectedClientId(client?.id || clients[0]?.id || "");
                    }
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    paymentMode === "client"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Привязать к игроку</span>
                </button>
              </div>

              {/* Client Selector if in 'client' mode and not fixed or changeable */}
              {paymentMode === "client" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Выберите игрока (клиента)
                  </label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedClientId(id);
                      const found = clients.find((c) => c.id === id);
                      if (found?.groupName) {
                        setSelectedGroup(found.groupName);
                      }
                    }}
                    className="w-full text-xs font-bold p-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 bg-white"
                  >
                    <option value="">-- Выберите игрока --</option>
                    {clients
                      .filter((c) => c.status !== "inactive")
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.childSurname} {c.childName} ({c.groupName || "Без группы"} — {c.parentName})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Select Abonement / Preset Type */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Быстрый выбор тарифа или статьи дохода:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                    {
                      id: "subrent",
                      title: "Сдача площадки",
                      price: null,
                      badge: "Аренда",
                    },
                    {
                      id: "custom",
                      title: "Своя сумма",
                      price: null,
                    },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleAbonementChange(item.id as any)}
                      className={`p-2.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                        abonementType === item.id
                          ? "border-emerald-500 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-500/20"
                          : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                      }`}
                    >
                      {item.badge && (
                        <span className="absolute top-2 right-2 text-[8px] font-black bg-emerald-600 text-white px-1.5 py-0.5 rounded-md">
                          {item.badge}
                        </span>
                      )}
                      <div className="font-extrabold text-xs text-slate-900">
                        {item.title}
                      </div>
                      <div className="text-xs font-black text-emerald-700 mt-1">
                        {item.price !== null
                          ? `${item.price.toLocaleString("ru-RU")} ₽`
                          : "Любая ₽"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Сумма дохода (₽)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={amount === 0 ? "" : amount}
                      onChange={(e) =>
                        setAmount(
                          e.target.value === "" ? 0 : Number(e.target.value),
                        )
                      }
                      className="w-full text-xs font-bold p-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 bg-white"
                      required
                    />
                    <DollarSign className="w-3.5 h-3.5 absolute right-3 top-3 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Дата поступления
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full text-xs font-bold p-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 bg-white"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Category & Group */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Статья дохода (БДДС)
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full text-xs font-bold p-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 bg-white"
                  >
                    {incomeCategories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                    {incomeCategories.length === 0 && (
                      <>
                        <option value="Абонементы">Абонементы</option>
                        <option value="Разовые тренировки">Разовые тренировки</option>
                        <option value="Прочие доходы">Прочие доходы</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Группа (необязательно)
                  </label>
                  <div className="relative">
                    <select
                      value={selectedGroup}
                      onChange={(e) => {
                        const nextGroup = e.target.value;
                        setSelectedGroup(nextGroup);
                        const grp = groups.find((g) => g.name === nextGroup);
                        if (grp?.venueId) {
                          setSelectedVenueId(grp.venueId);
                        }
                      }}
                      className="w-full text-xs font-bold p-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 bg-white"
                    >
                      <option value="">-- Без группы --</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.name}>
                          {g.name} ({g.coachName})
                        </option>
                      ))}
                    </select>
                    <Users className="w-3.5 h-3.5 absolute right-3 top-3 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Venue / Object Link */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Площадка / Объект (для экономики объекта)
                </label>
                <select
                  value={selectedVenueId}
                  onChange={(e) => setSelectedVenueId(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 bg-white"
                >
                  <option value="">
                    -- Без привязки к объекту (или по группе) --
                  </option>
                  {counterparties
                    .filter(
                      (cp) =>
                        cp.type === "school_rent" ||
                        cp.type === "hall_rent" ||
                        cp.type === "other",
                    )
                    .map((cp) => (
                      <option key={cp.id} value={cp.id}>
                        {cp.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Payment Account & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Касса / Расчетный счет
                  </label>
                  <select
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 bg-white"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} (
                        {acc.type === "bank"
                          ? "Р/С Банк"
                          : acc.type === "cash"
                            ? "Касса"
                            : "Эквайринг"}
                        )
                      </option>
                    ))}
                    {accounts.length === 0 && (
                      <option value="acc_bank">Расчетный счет (Банк)</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Основание / Комментарий
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={customDescription}
                      onChange={(e) => setCustomDescription(e.target.value)}
                      placeholder={
                        paymentMode === "unlinked"
                          ? "Напр., разовая оплата, форма, турнир..."
                          : "Комментарий к оплате..."
                      }
                      className="w-full text-xs font-medium p-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 bg-white"
                    />
                    <FileText className="w-3.5 h-3.5 absolute right-3 top-3 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                  {errorMsg}
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
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
                      <span>
                        {paymentMode === "unlinked"
                          ? "Зачислить доход без привязки"
                          : "Провести оплату и зачислить"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : step === "unlinked_success" ? (
            <div className="p-6 text-center space-y-5 animate-scale-in">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl mx-auto flex items-center justify-center shadow-inner">
                <CheckCircle className="w-8 h-8" />
              </div>

              <div>
                <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[10px] uppercase px-3 py-1 rounded-full">
                  ✓ Доход успешно зачислен
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-2">
                  +{Number(amount).toLocaleString("ru-RU")} ₽ проведено в учет
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Поступление по статье <strong>«{selectedCategory}»</strong> без привязки к конкретному игроку успешно добавлено в БДДС и отчет P&L.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep("form");
                    setCustomDescription("");
                  }}
                  className="flex-1 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-2xl text-xs transition flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Внести ещё доход</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs transition shadow-md"
                >
                  Готово
                </button>
              </div>
            </div>
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
                  Платёж зачислен, статус клиента изменен на{" "}
                  <strong>"Оплачено"</strong>, финансовая операция зафиксирована.
                  Отправьте родителю ссылку для входа в персональную страницу.
                </p>
              </div>

              {/* Invite Link Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Персональная ссылка для {activeClient?.parentName}
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
                    {copiedLink ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
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
