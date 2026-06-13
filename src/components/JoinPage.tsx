import React, { useState } from "react";
import { useCRM } from "../context/CRMContext";
import {
  Trophy,
  CheckCircle,
  Shield,
  Phone,
  User,
  Sparkles,
  Send,
  Target,
  ChevronRight,
  Star,
  Heart,
  MapPin,
} from "lucide-react";
import { AmkarLogo } from "./AmkarLogo";

import heroImage from "../assets/images/kids_soccer_background_1780828846133.png";

export const JoinPage: React.FC = () => {
  const { schoolName, addLead, crmConfig } = useCRM();
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [childName, setChildName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  // Generate Kids Football Image
  // Placeholders for local files.
  // User needs to upload them to public/ folder with these names.
  const gallery1 = "/111.jpg";
  const gallery2 = "/we.jpg";
  const gallery3 = "/ball.jpg";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentName || !parentPhone) return;

    // Add as a new lead
    addLead({
      parentName,
      parentPhone,
      childName: childName || "",
      childSurname: "",
      childAge: 0,
      source: "Лендинг",
      note: "Заявка с посадочной страницы на бесплатную тренировку",
    });

    setSubmitted(true);
  };

  const scrollToForm = () => {
    document
      .getElementById("trial-form")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-red-500 selection:text-white">
      {/* Header */}
      <header className="bg-white/90 border-b border-white/20 py-4 px-6 fixed top-0 w-full z-50 backdrop-blur-xl shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <AmkarLogo className="w-10 h-10" />
            <span className="font-extrabold tracking-tight text-slate-900 text-lg uppercase hidden sm:block">
              {schoolName || "АМКАР ЮНИОР"}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={scrollToForm}
              className="hidden md:inline-flex items-center px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg text-xs transition"
            >
              Записаться
            </button>
            <a
              href="/crm"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs uppercase tracking-wide transition shadow-lg shadow-slate-900/20"
            >
              Войти в кабинет
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 lg:pt-40 lg:pb-32 px-4 overflow-hidden">
        {/* Background Layer */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-transparent z-10" />
          <img
            src={heroImage}
            alt="Футбол Амкар"
            className="w-full h-full object-cover opacity-80"
            fetchPriority="high"
            decoding="async"
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 text-left">
            <div className="inline-flex items-center space-x-2 bg-red-500/10 text-red-400 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border border-red-500/20 backdrop-blur-sm">
              <Sparkles className="w-4 h-4" />
              <span>Набор на сезон {new Date().getFullYear()}</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-[1.1] uppercase">
              Детский футбол <br />
              <span className="text-red-500 drop-shadow-md">Нового Уровня</span>
            </h1>
            <p className="text-slate-300 text-base md:text-xl max-w-xl leading-relaxed">
              Академия футбольного клуба {schoolName || "Амкар Юниор"}{" "}
              приглашает детей от 4 до 12 лет. Профессиональные тренеры, топовая
              инфраструктура, турниры и личный кабинет с геймификацией для
              прогресса.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={scrollToForm}
                className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-black uppercase text-sm rounded-2xl transition shadow-xl shadow-red-600/30 flex justify-center items-center"
              >
                Первая тренировка бесплатно{" "}
                <ChevronRight className="w-5 h-5 ml-2" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* About & Benefits Section */}
      <section className="py-20 px-4 bg-white relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center space-x-2 bg-red-500/10 text-red-500 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border border-red-500/20">
                <Target className="w-4 h-4" />
                <span>О школе</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 uppercase tracking-tight">
                Первая ступень к{" "}
                <span className="text-red-500">большому футболу</span>
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed">
                Это система подготовки, где дети делают первые и самые важные
                шаги в спорте. Наша главная цель — привить любовь к футболу, а
                через него — воспитать характер, уверенность в себе и умение
                работать в команде.
              </p>

              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex gap-4 mt-8">
                <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                  <Trophy className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-lg mb-2 uppercase tracking-wide">
                    Наша философия
                  </h4>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Мы верим, что гармоничное развитие и радость от игры —
                    основа будущих побед. Мы не просто тренируем технику, а
                    создаем среду, в которой раскрывается потенциал каждого
                    ребенка.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-8 bg-slate-50 p-8 md:p-10 rounded-[2rem] border border-slate-100">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-6">
                Почему выбирают нас?
              </h3>

              <div className="space-y-6">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 bg-white text-red-500 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-slate-200">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base mb-1">
                      Системный подход
                    </h4>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      Методика «от простого к сложному» плавно готовит детей к
                      серьезному уровню. Мы фокусируемся на всестороннем
                      развитии: координация, скорость, мышление, работа в
                      команде.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 bg-white text-red-500 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-slate-200">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base mb-1">
                      Индивидуальное внимание
                    </h4>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      На каждой тренировке работает связка «тренер + ассистент».
                      Это позволяет уделить максимум внимания технике и
                      безопасности каждого воспитанника, помочь ему
                      прогрессировать в комфортном темпе и чувствовать себя
                      частью команды.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 bg-white text-red-500 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-slate-200">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base mb-1">
                      Безопасность и инфраструктура
                    </h4>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      Занятия проходят на качественных площадках в атмосфере
                      дружбы и поддержки.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200 mt-6 text-center sm:text-left">
                <p className="text-xl font-black text-slate-900 uppercase tracking-wide">
                  Приходите в «Амкар Юниор».
                </p>
                <p className="text-red-500 font-bold text-lg mt-1">
                  Здесь начинается путь чемпиона!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-12 bg-slate-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <img
              src={gallery1}
              alt="Тренировка"
              className="w-full h-48 md:h-64 object-cover rounded-2xl shadow-sm"
              loading="lazy"
              decoding="async"
            />
            <img
              src={gallery2}
              alt="Команда"
              className="w-full h-48 md:h-64 object-cover rounded-2xl shadow-sm"
              loading="lazy"
              decoding="async"
            />
            <img
              src={gallery3}
              alt="Победа"
              className="w-full h-48 md:h-64 object-cover rounded-2xl shadow-sm hidden md:block"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </section>

      {/* Single Column Layout for Form */}
      <section id="trial-form" className="py-20 px-4 bg-slate-50">
        <div className="max-w-2xl mx-auto">
          {/* Trial Request Form */}
          <div className="bg-white p-8 md:p-12 rounded-[2rem] border border-slate-200 relative overflow-hidden shadow-2xl shadow-slate-200/50">
            <div className="absolute top-0 right-0 w-48 h-48 bg-red-100 rounded-bl-[6rem] -z-0 opacity-50"></div>

            <div className="relative flex flex-col items-center text-center space-y-3 mb-8">
              <div className="w-20 h-20 bg-slate-900 text-white rounded-3xl flex items-center justify-center -rotate-3 shadow-xl mb-2">
                <Target className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
                Оставьте заявку
              </h2>
              <p className="text-sm text-slate-500 max-w-xs">
                Менеджер перезвонит вам за 15 минут, подберет удобную локацию и
                время.
              </p>
            </div>

            {submitted ? (
              <div className="text-center py-10 space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-12 h-12" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 uppercase">
                  Заявка в штабе!
                </h3>
                <p className="text-base text-slate-500">
                  Спасибо. Заявка отправлена напрямую в CRM-систему клуба,
                  менеджер свяжется с вами по номеру {parentPhone}.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-6 px-8 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-sm transition"
                >
                  Записать еще одного
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 relative">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
                    ФИО Родителя *
                  </label>
                  <div className="relative">
                    <User className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-base font-medium text-slate-900 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 transition shadow-sm"
                      placeholder="Иванов Иван Иванович"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
                    Телефон *
                  </label>
                  <div className="relative">
                    <Phone className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-base font-medium text-slate-900 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 transition shadow-sm"
                      placeholder="+7 (999) 000-00-00"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
                    Имя и возраст ребенка (опц.)
                  </label>
                  <div className="relative">
                    <Trophy className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={childName}
                      onChange={(e) => setChildName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-base font-medium text-slate-900 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 transition shadow-sm"
                      placeholder="Например: Артем, 8 лет"
                    />
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 rounded-xl">
                  <input
                    type="checkbox"
                    id="join-privacy"
                    checked={privacyAccepted}
                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                    className="mt-1 w-5 h-5 text-red-600 rounded border-slate-300 focus:ring-red-500 cursor-pointer"
                  />
                  <label
                    htmlFor="join-privacy"
                    className="text-[12px] text-slate-500 leading-relaxed"
                  >
                    Я выражаю свое согласие с{" "}
                    <a
                      href="/privacy"
                      className="text-red-600 hover:text-red-700 underline font-medium"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Политикой конфиденциальности
                    </a>{" "}
                    и даю согласие на{" "}
                    <a
                      href="/safety"
                      className="text-red-600 hover:text-red-700 underline font-medium"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      обработку персональных данных
                    </a>.
                  </label>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={!privacyAccepted}
                    className="w-full py-5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-black text-lg uppercase tracking-wider rounded-2xl shadow-xl shadow-red-600/20 flex items-center justify-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 disabled:shadow-none"
                  >
                    <Send className="w-5 h-5" />
                    <span>Хочу в команду!</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 px-6 py-12 md:py-20 text-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center md:items-start gap-8">
          <div className="flex flex-col items-center md:items-start space-y-4">
            <div className="flex items-center space-x-3 opacity-90">
              <AmkarLogo className="w-12 h-12" />
              <span className="font-black tracking-widest text-xl uppercase">
                {schoolName || "АМКАР ЮНИОР"}
              </span>
            </div>
            <p className="text-slate-500 text-sm max-w-sm text-center md:text-left">
              Официальная детская академия. Воспитываем не только спортсменов,
              но и сильных личностей.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end space-y-3">
            <div className="flex space-x-2 items-center text-slate-300">
              <MapPin className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium">
                г. Пермь, манежи и залы
              </span>
            </div>
            <a
              href="/crm"
              className="text-red-400 hover:text-red-300 font-bold uppercase text-xs tracking-widest underline underline-offset-4 mt-2"
            >
              Войти в кабинет (CRM)
            </a>
            <a
              href="/privacy"
              className="text-slate-600 hover:text-slate-400 text-xs mt-4 transition"
            >
              Политика конфиденциальности
            </a>
            <a
              href="/safety"
              className="text-slate-600 hover:text-slate-400 text-xs mt-1 transition"
            >
              Обработка персональных данных
            </a>
            <p className="text-slate-700 text-xs mt-2">
              © {new Date().getFullYear()} {schoolName || "Амкар Юниор"}. Все
              права защищены.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
