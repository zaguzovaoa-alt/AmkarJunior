import React, { useState, useEffect } from "react";
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
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { AmkarLogo } from "./AmkarLogo";
import { BlogSection } from "./BlogSection";
import { ArticleView } from "./ArticleView";
import { BlogPage } from "./BlogPage";
import { BlogArticle, BLOG_ARTICLES, getArticleBySlug } from "../data/blogArticles";

import heroImage from "../assets/images/kids_soccer_background_1780828846133.jpg";

export const JoinPage: React.FC = () => {
  const { schoolName, addLead, crmConfig } = useCRM();

  // Tab & Article routing state
  const [activeTab, setActiveTab] = useState<"landing" | "blog">("landing");
  const [selectedArticle, setSelectedArticle] = useState<BlogArticle | null>(null);

  // Initialize from current URL
  useEffect(() => {
    const handleUrlRoute = () => {
      const path = window.location.pathname;
      if (path === "/blog" || path === "/blog/") {
        setActiveTab("blog");
        setSelectedArticle(null);
      } else if (path.startsWith("/blog/")) {
        const slug = path.replace("/blog/", "");
        const found = getArticleBySlug(slug);
        if (found) {
          setSelectedArticle(found);
          setActiveTab("blog");
        } else {
          setActiveTab("blog");
          setSelectedArticle(null);
        }
      } else {
        setActiveTab("landing");
        setSelectedArticle(null);
      }
    };

    handleUrlRoute();
    window.addEventListener("popstate", handleUrlRoute);
    return () => window.removeEventListener("popstate", handleUrlRoute);
  }, []);

  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState<string>("8");
  const [submitted, setSubmitted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenArticle = (article: BlogArticle) => {
    setSelectedArticle(article);
    setActiveTab("blog");
    window.history.pushState({}, "", `/blog/${article.slug}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenBlog = () => {
    setSelectedArticle(null);
    setActiveTab("blog");
    window.history.pushState({}, "", "/blog");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleGoHome = () => {
    setSelectedArticle(null);
    setActiveTab("landing");
    window.history.pushState({}, "", "/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Generate Kids Football Image
  // Placeholders for local files.
  // User needs to upload them to public/ folder with these names.
  const gallery1 = "/111.jpg";
  const gallery2 = "/we.jpg";
  const gallery3 = "/ball.jpg";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentName || !parentPhone) return;

    setIsSubmitting(true);
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get("ref");

    let parsedChildName = childName.trim();
    let parsedChildSurname = "";
    let parsedAge = parseInt(childAge, 10) || 0;

    // Smart parsing for "Прохор, 8 лет" or "Быстрых Прохор"
    if (parsedChildName) {
      const ageMatch = parsedChildName.match(/(\d+)\s*(?:лет|год|года|г\.?р\.?)?/i);
      if (ageMatch && !parsedAge) {
        parsedAge = parseInt(ageMatch[1], 10);
      }
      parsedChildName = parsedChildName.replace(/,?\s*\d+\s*(?:лет|год|года|г\.?р\.?)?/i, "").trim();

      const parts = parsedChildName.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        parsedChildSurname = parts[0];
        parsedChildName = parts.slice(1).join(" ");
      }
    }

    if (!parsedChildSurname && parentName.trim()) {
      const pParts = parentName.trim().split(/\s+/).filter(Boolean);
      if (pParts.length >= 2) {
        parsedChildSurname = pParts[0];
      }
    }

    const currentYear = new Date().getFullYear();
    const childBirthYear = parsedAge > 0 ? currentYear - parsedAge : 2018;

    // Add as a new lead in CRM
    await addLead({
      parentName: parentName.trim(),
      parentPhone: parentPhone.trim(),
      childName: parsedChildName || "Ребенок",
      childSurname: parsedChildSurname,
      childAge: parsedAge,
      childBirthYear: childBirthYear,
      source: "Лендинг",
      notes: `Заявка с посадочной страницы на бесплатную тренировку${refCode ? `. Пригласил: ${refCode}` : ''}`,
    });

    setIsSubmitting(false);
    setSubmitted(true);
  };

  const scrollToForm = () => {
    document
      .getElementById("trial-form")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  // If user selected an article, show full reader view
  if (selectedArticle) {
    return (
      <ArticleView
        article={selectedArticle}
        onBackToBlog={handleOpenBlog}
        onSelectArticle={handleOpenArticle}
        onGoHome={handleGoHome}
      />
    );
  }

  // If user switched to full Blog catalog
  if (activeTab === "blog") {
    return (
      <BlogPage
        onGoHome={handleGoHome}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-red-500 selection:text-white">
      {/* Header */}
      <header className="bg-white/95 border-b border-slate-200/80 py-3.5 px-4 sm:px-6 fixed top-0 w-full z-50 backdrop-blur-xl shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={handleGoHome}
          >
            <AmkarLogo className="w-10 h-10" />
            <div className="flex flex-col">
              <span className="font-extrabold tracking-tight text-slate-900 text-base sm:text-lg uppercase leading-none">
                {schoolName || "АМКАР ЮНИОР"}
              </span>
              <span className="text-[10px] font-bold text-red-600 tracking-wider uppercase hidden sm:block mt-0.5">
                Пермь • Детская футбольная школа
              </span>
            </div>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <button
              onClick={handleGoHome}
              className="px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-slate-900 hover:text-red-600 transition rounded-lg hover:bg-slate-50"
            >
              Главная
            </button>
            <button
              onClick={() => {
                document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-red-600 transition rounded-lg hover:bg-slate-50"
            >
              О школе
            </button>
            <button
              onClick={() => {
                document.getElementById("why-us")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-red-600 transition rounded-lg hover:bg-slate-50"
            >
              Преимущества
            </button>
            <button
              onClick={() => {
                document.getElementById("blog")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 hover:text-red-600 transition rounded-lg hover:bg-red-50/50 flex items-center space-x-1.5 group"
            >
              <BookOpen className="w-3.5 h-3.5 text-red-600 group-hover:scale-110 transition-transform" />
              <span>Блог</span>
              <span className="bg-red-100 text-red-600 text-[10px] px-1.5 py-0.2 rounded-full font-black">
                4
              </span>
            </button>
          </nav>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleOpenBlog}
              className="md:hidden inline-flex items-center space-x-1 px-3 py-1.5 bg-red-50 text-red-600 font-bold rounded-lg text-xs"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Блог</span>
            </button>
            <button
              onClick={scrollToForm}
              className="hidden sm:inline-flex items-center px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg text-xs transition"
            >
              Записаться
            </button>
            <a
              href="/crm"
              className="px-4 sm:px-5 py-2 sm:py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs uppercase tracking-wide transition shadow-lg shadow-slate-900/20"
            >
              Войти в CRM
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
              Детская футбольная школа {schoolName || "Амкар Юниор"}{" "}
              приглашает детей от 4 до 12 лет. Профессиональные тренеры, качественные
              тренировки, турниры и личный кабинет с геймификацией для
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
      <section id="about" className="py-20 px-4 bg-white relative">
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

            <div id="why-us" className="space-y-8 bg-slate-50 p-8 md:p-10 rounded-[2rem] border border-slate-100">
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

      {/* Organic Blog Section on Landing */}
      <BlogSection
        onOpenArticle={handleOpenArticle}
        onOpenBlog={handleOpenBlog}
      />

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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
                      Имя ребенка
                    </label>
                    <div className="relative">
                      <Trophy className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={childName}
                        onChange={(e) => setChildName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-base font-medium text-slate-900 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 transition shadow-sm"
                        placeholder="Например: Прохор"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
                      Возраст
                    </label>
                    <select
                      value={childAge}
                      onChange={(e) => setChildAge(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-4 text-base font-medium text-slate-900 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 transition shadow-sm"
                    >
                      {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((age) => (
                        <option key={age} value={age}>
                          {age} {age >= 5 ? "лет" : "года"}
                        </option>
                      ))}
                    </select>
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
      <footer className="bg-slate-950 px-6 py-12 md:py-16 text-white border-t border-slate-900">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-5 flex flex-col space-y-4">
            <div className="flex items-center space-x-3 opacity-95">
              <AmkarLogo className="w-12 h-12" />
              <div>
                <span className="font-black tracking-widest text-xl uppercase block leading-none">
                  {schoolName || "АМКАР ЮНИОР"}
                </span>
                <span className="text-red-500 text-xs font-bold uppercase tracking-wider">
                  Детская футбольная школа • Пермь
                </span>
              </div>
            </div>
            <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
              Официальная детская футбольная школа клуба «Амкар». Воспитываем сильных, здоровых и уверенных в себе ребят с 4 до 12 лет в комфортных залах Перми.
            </p>
            <div className="flex items-center space-x-4 pt-1">
              <a href="tel:+79991259055" className="text-slate-200 hover:text-white font-bold tracking-wider text-sm transition">
                +7-999-125-90-55
              </a>
              <a
                href="https://vk.com/amkarkids"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-9 h-9 bg-[#0077FF] hover:bg-[#0066DD] text-white rounded-full transition shadow-md"
                aria-label="ВКонтакте"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M15.071 2H8.929C3.197 2 2 3.197 2 8.929v6.142C2 20.803 3.197 22 8.929 22h6.142C20.803 22 22 20.803 22 15.071V8.929C22 3.197 20.803 2 15.071 2Zm1.69 11.233c.47.452.964.88 1.405 1.353.303.326.58.675.76 1.096.14.331.026.657-.291.737-.872.222-1.761.164-2.645.106-.411-.027-.751-.237-1.02-.544-.393-.45-.76-.92-1.156-1.365-.181-.205-.386-.388-.637-.509-.344-.167-.621-.07-.811.268-.278.497-.37 1.037-.417 1.589-.028.322-.164.48-.488.513-.996.104-1.954.02-2.85-.357-1.314-.55-2.316-1.428-3.136-2.548-1.57-2.146-2.656-4.52-3.465-7.01-.13-.4-.007-.638.414-.654.896-.034 1.792-.023 2.688 0 .341.008.544.17.653.493.473 1.408 1.077 2.748 1.905 3.966.257.378.547.733.91 1.02.261.206.499.147.636-.162.247-.557.323-1.139.313-1.74-.012-.76-.145-1.488-.588-2.14-.183-.271-.121-.453.18-.553.253-.083.52-.108.784-.108 1.026 0 2.052.001 3.078 0 .323 0 .546.12.637.426.151.512.183 1.042.17 1.576-.027 1.066-.002 2.133.245 3.183.059.251.246.33.447.198.349-.23.633-.538.905-.851.654-.755 1.156-1.61 1.554-2.527.18-.413.342-.835.495-1.258.118-.327.319-.481.67-.478.932.006 1.865.006 2.797 0 .428-.003.626.182.522.618-.21.884-.668 1.684-1.158 2.458-.453.714-.946 1.398-1.464 2.062-.236.302-.27.535.011.838Z" />
                </svg>
              </a>
            </div>
          </div>

          {/* SEO Blog Links */}
          <div className="md:col-span-4 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-red-500">
              <BookOpen className="w-4 h-4" />
              <span>Полезные статьи и блог</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-400">
              {BLOG_ARTICLES.map((art) => (
                <li key={art.id}>
                  <button
                    onClick={() => handleOpenArticle(art)}
                    className="hover:text-white transition text-left line-clamp-1 flex items-center space-x-1"
                  >
                    <span>•</span>
                    <span>{art.title}</span>
                  </button>
                </li>
              ))}
              <li className="pt-1">
                <button
                  onClick={handleOpenBlog}
                  className="text-red-400 hover:text-red-300 font-bold flex items-center space-x-1"
                >
                  <span>Все статьи блога</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </li>
            </ul>
          </div>

          {/* Legal and Location */}
          <div className="md:col-span-3 flex flex-col space-y-3 md:items-end">
            <div className="flex space-x-2 items-center text-slate-300">
              <MapPin className="w-4 h-4 text-red-500" />
              <span className="text-xs font-semibold">
                г. Пермь (все районы)
              </span>
            </div>
            <a
              href="/crm"
              className="text-red-400 hover:text-red-300 font-bold uppercase text-xs tracking-widest underline underline-offset-4"
            >
              Войти в кабинет (CRM)
            </a>
            <div className="flex flex-col space-y-1 text-xs text-slate-500 md:text-right pt-2">
              <a href="/privacy" className="hover:text-slate-400 transition">
                Политика конфиденциальности
              </a>
              <a href="/safety" className="hover:text-slate-400 transition">
                Обработка персональных данных
              </a>
              <a href="/offer" className="hover:text-slate-400 transition">
                Договор оферты
              </a>
            </div>
            <p className="text-slate-600 text-[11px] mt-2 md:text-right">
              © {new Date().getFullYear()} {schoolName || "Амкар Юниор"}. Все права защищены.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
