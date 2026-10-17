import React, { useState, useEffect } from "react";
import { BlogArticle, BLOG_ARTICLES } from "../data/blogArticles";
import { updateSEOForArticle, resetDefaultSEO } from "../utils/seo";
import { useCRM } from "../context/CRMContext";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Share2,
  CheckCircle,
  Copy,
  Check,
  MapPin,
  Sparkles,
  Dumbbell,
  AlertCircle,
  Send,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Award,
  ShieldCheck,
  Bookmark,
} from "lucide-react";
import { AmkarLogo } from "./AmkarLogo";

interface ArticleViewProps {
  article: BlogArticle;
  onBackToBlog: () => void;
  onSelectArticle: (article: BlogArticle) => void;
  onGoHome?: () => void;
}

export const ArticleView: React.FC<ArticleViewProps> = ({
  article,
  onBackToBlog,
  onSelectArticle,
  onGoHome,
}) => {
  const { addLead, schoolName } = useCRM();

  // Progress Bar
  const [readingProgress, setReadingProgress] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Form State
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("7");
  const [privacyAccepted, setPrivacyAccepted] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Scroll to top & set dynamic SEO on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    updateSEOForArticle(article);

    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100));
        setReadingProgress(progress);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      resetDefaultSEO();
    };
  }, [article]);

  const handleShare = async (platform?: string) => {
    const url = `${window.location.origin}/blog/${article.slug}`;
    const text = `${article.title} — ${schoolName || "Амкар Юниор Пермь"}`;

    if (platform === "tg") {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, "_blank");
      return;
    }
    if (platform === "vk") {
      window.open(`https://vk.com/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`, "_blank");
      return;
    }
    if (platform === "wa") {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`${text}\n${url}`)}`, "_blank");
      return;
    }

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
    } catch {
      // Fallback
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentName.trim() || !parentPhone.trim()) return;

    setIsSubmitting(true);
    let parsedChildName = childName.trim();
    let parsedChildSurname = "";
    let parsedAge = parseInt(childAge, 10) || 7;

    const parts = parsedChildName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      parsedChildSurname = parts[0];
      parsedChildName = parts.slice(1).join(" ");
    } else if (parentName.trim()) {
      const pParts = parentName.trim().split(/\s+/).filter(Boolean);
      if (pParts.length >= 2) {
        parsedChildSurname = pParts[0];
      }
    }

    const currentYear = new Date().getFullYear();
    const childBirthYear = parsedAge > 0 ? currentYear - parsedAge : 2019;

    await addLead({
      parentName: parentName.trim(),
      parentPhone: parentPhone.trim(),
      childName: parsedChildName || "Ребенок",
      childSurname: parsedChildSurname,
      childAge: parsedAge,
      childBirthYear: childBirthYear,
      source: `Блог: ${article.title.slice(0, 35)}...`,
      notes: `Заявка из статьи блога "${article.title}". Интересует бесплатная пробная тренировка в Перми.`,
    });

    setIsSubmitting(false);
    setSubmitted(true);
  };

  const relatedArticles = BLOG_ARTICLES.filter((a) => a.id !== article.id).slice(0, 3);

  const formattedDate = new Date(article.publishedAt).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-red-500 selection:text-white">
      {/* Reading Progress Indicator */}
      <div className="fixed top-0 left-0 right-0 h-1.5 bg-slate-200 z-50">
        <div
          className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-150"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Top Header / Navigation */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-200/80 z-40 px-4 py-3.5 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={onBackToBlog}
            className="inline-flex items-center space-x-2 text-slate-700 hover:text-red-600 font-bold text-xs sm:text-sm transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Ко всем статьям блога</span>
          </button>

          <div
            onClick={onGoHome || onBackToBlog}
            className="flex items-center space-x-2 cursor-pointer"
          >
            <AmkarLogo className="w-8 h-8" />
            <span className="font-extrabold text-slate-900 tracking-tight text-xs sm:text-sm uppercase hidden sm:inline">
              {schoolName || "АМКАР ЮНИОР"} • Блог
            </span>
          </div>

          <button
            onClick={() => {
              document.getElementById("lead-form-box")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs rounded-xl transition shadow-md shadow-red-600/20"
          >
            Записаться
          </button>
        </div>
      </header>

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="max-w-4xl mx-auto px-4 pt-6 pb-2 text-xs text-slate-500 flex items-center space-x-2 flex-wrap">
        <button
          onClick={onGoHome || onBackToBlog}
          className="hover:text-red-600 transition"
        >
          Главная
        </button>
        <span>/</span>
        <button
          onClick={onBackToBlog}
          className="hover:text-red-600 transition"
        >
          Блог
        </button>
        <span>/</span>
        <span className="text-slate-800 font-medium line-clamp-1">
          {article.title}
        </span>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-6 md:py-10">
        {/* Article Header Card */}
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${article.categoryColor}`}
            >
              {article.category}
            </span>
            {article.geoContext && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-900 text-white flex items-center space-x-1">
                <MapPin className="w-3 h-3 text-red-500" />
                <span>{article.geoContext.city}</span>
              </span>
            )}
            <span className="text-xs text-slate-500 flex items-center space-x-1 ml-auto">
              <Clock className="w-3.5 h-3.5" />
              <span>{article.readTimeMinutes} мин чтения</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.2]">
            {article.title}
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-slate-600 leading-relaxed font-normal bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm border-l-4 border-l-red-500">
            {article.leadExcerpt}
          </p>

          {/* Author & Meta Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-y border-slate-200 text-xs sm:text-sm text-slate-600">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-red-600/10 border border-red-600/20 flex items-center justify-center text-red-600 font-black">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-slate-900">{article.author}</p>
                <p className="text-xs text-slate-500">{article.authorRole}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1 text-slate-500">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formattedDate}</span>
              </span>

              {/* Share triggers */}
              <div className="flex items-center space-x-1.5 pl-3 border-l border-slate-200">
                <span className="text-xs text-slate-400 mr-1 hidden sm:inline">Поделиться:</span>
                <button
                  onClick={() => handleShare("tg")}
                  title="Поделиться в Telegram"
                  className="w-8 h-8 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleShare("vk")}
                  title="Поделиться во ВКонтакте"
                  className="w-8 h-8 rounded-full bg-sky-50 hover:bg-sky-100 text-sky-600 flex items-center justify-center transition font-bold text-xs"
                >
                  VK
                </button>
                <button
                  onClick={() => handleShare()}
                  title="Скопировать ссылку"
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition relative"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Hero Article Image */}
          <div className="relative rounded-3xl overflow-hidden shadow-lg border border-slate-200/80 max-h-[460px] bg-slate-900">
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-slate-950/80 to-transparent text-white/90 text-xs flex justify-between items-center">
              <span>Футбольная школа «Амкар Юниор» Пермь</span>
              <span className="bg-red-600/90 text-white font-bold px-2.5 py-0.5 rounded-full text-[10px] uppercase">
                Тренировочный процесс
              </span>
            </div>
          </div>
        </div>

        {/* Article Body Content */}
        <article className="mt-10 space-y-10">
          {article.sections.map((section, idx) => (
            <section key={idx} className="space-y-5 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/70 shadow-sm">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug flex items-start space-x-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center text-sm font-black mt-0.5">
                  {idx + 1}
                </span>
                <span>{section.title}</span>
              </h2>

              {section.paragraphs.map((p, pIdx) => (
                <p key={pIdx} className="text-slate-700 text-base sm:text-lg leading-relaxed">
                  {p}
                </p>
              ))}

              {section.bulletPoints && section.bulletPoints.length > 0 && (
                <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/60 space-y-2.5">
                  {section.bulletPoints.map((point, bIdx) => (
                    <div key={bIdx} className="flex items-start space-x-3 text-slate-800 text-sm sm:text-base">
                      <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Callouts */}
              {section.callout && (
                <div
                  className={`p-5 rounded-2xl border text-sm sm:text-base leading-relaxed ${
                    section.callout.type === "perm"
                      ? "bg-amber-50/70 border-amber-300/80 text-amber-950"
                      : section.callout.type === "stat"
                      ? "bg-emerald-50/70 border-emerald-300/80 text-emerald-950"
                      : "bg-red-50/70 border-red-300/80 text-red-950"
                  }`}
                >
                  <div className="flex items-center space-x-2 font-bold mb-1.5 uppercase text-xs tracking-wider">
                    {section.callout.type === "perm" ? (
                      <MapPin className="w-4 h-4 text-amber-700" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-red-600" />
                    )}
                    <span>{section.callout.title}</span>
                  </div>
                  <p>{section.callout.text}</p>
                </div>
              )}

              {/* Exercise Card */}
              {section.exercise && (
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-6 shadow-xl border border-slate-800 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-800">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white">
                        <Dumbbell className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-white text-base sm:text-lg">
                          {section.exercise.title}
                        </h4>
                        <p className="text-xs text-red-400 font-medium">
                          Цель: {section.exercise.target}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="bg-slate-800 px-3 py-1 rounded-full text-slate-300 border border-slate-700">
                        {section.exercise.age}
                      </span>
                      <span className="bg-red-600/30 text-red-300 px-3 py-1 rounded-full border border-red-500/30">
                        {section.exercise.duration}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs sm:text-sm text-slate-300">
                    <p className="font-semibold text-white">
                      ⚽ Инвентарь: <span className="font-normal text-slate-300">{section.exercise.equipment}</span>
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <p className="font-bold text-xs uppercase tracking-wider text-slate-400">Пошаговая инструкция:</p>
                    <div className="space-y-2">
                      {section.exercise.steps.map((step, sIdx) => (
                        <div key={sIdx} className="flex items-start space-x-3 text-xs sm:text-sm text-slate-200">
                          <span className="w-5 h-5 rounded-full bg-red-600/80 text-white flex-shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5">
                            {sIdx + 1}
                          </span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 text-xs sm:text-sm space-y-1">
                    <p className="font-bold text-amber-400 flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Внимание тренера:</span>
                    </p>
                    <p className="text-slate-300 leading-relaxed">{section.exercise.coachTips}</p>
                  </div>

                  {section.exercise.commonMistakes.length > 0 && (
                    <div className="space-y-1 text-xs sm:text-sm text-rose-300">
                      <p className="font-bold text-rose-400 flex items-center space-x-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Частые ошибки:</span>
                      </p>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-300 pl-1">
                        {section.exercise.commonMistakes.map((m, mIdx) => (
                          <li key={mIdx}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </section>
          ))}
        </article>

        {/* Perm Geo Banner */}
        {article.geoContext && (
          <div className="mt-10 bg-gradient-to-r from-red-950 via-slate-900 to-slate-950 text-white p-6 sm:p-8 rounded-3xl border border-red-500/30 shadow-xl relative overflow-hidden">
            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center space-x-2 bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-red-500/30">
                <MapPin className="w-3.5 h-3.5" />
                <span>Детский футбол в г. Пермь</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                Тренируйтесь рядом с домом в Перми
              </h3>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
                {article.geoContext.venuesText}. Мы подбираем комфортный график и группу по возрасту вашего ребенка в удобном районе Перми:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {article.geoContext.districts.map((d, dIdx) => (
                  <span
                    key={dIdx}
                    className="px-3 py-1 bg-white/10 rounded-xl text-xs font-semibold backdrop-blur-sm border border-white/15"
                  >
                    р-н {d}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* FAQs Accordion */}
        {article.faqs && article.faqs.length > 0 && (
          <div className="mt-12 space-y-4">
            <div className="flex items-center space-x-2">
              <HelpCircle className="w-5 h-5 text-red-600" />
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Часто задаваемые вопросы родителей
              </h3>
            </div>

            <div className="space-y-3">
              {article.faqs.map((faq, fIdx) => {
                const isOpen = openFaqIndex === fIdx;
                return (
                  <div
                    key={fIdx}
                    className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm transition"
                  >
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : fIdx)}
                      className="w-full p-5 text-left flex items-center justify-between space-x-4 font-bold text-slate-900 hover:text-red-600 transition"
                    >
                      <span className="text-base sm:text-lg">{faq.question}</span>
                      {isOpen ? (
                        <ChevronUp className="w-5 h-5 text-red-600 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-slate-600 text-sm sm:text-base leading-relaxed border-t border-slate-100 bg-slate-50/50">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Embedded High-Conversion Trial Form */}
        <div id="lead-form-box" className="mt-14 scroll-mt-20">
          <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-3xl p-6 sm:p-10 text-white shadow-2xl shadow-red-600/30">
            {submitted ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto text-white">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-black">
                  Заявка принята!
                </h3>
                <p className="text-white/90 text-sm sm:text-base max-w-md mx-auto">
                  Спасибо! Наш тренер свяжется с вами в течение 15 минут, ответит на все вопросы и запишет ребенка на бесплатную пробную тренировку в удобном зале Перми.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-4 px-6 py-2.5 bg-white text-red-600 font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-slate-100 transition"
                >
                  Отправить еще одну заявку
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-12 gap-8 items-center">
                <div className="md:col-span-6 space-y-4">
                  <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-black uppercase tracking-wider inline-block">
                    Бесплатное пробное занятие
                  </span>
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight">
                    Запишите ребенка на футбол в Перми прямо сейчас
                  </h3>
                  <p className="text-white/90 text-sm sm:text-base leading-relaxed">
                    Познакомьтесь с тренером, оцените атмосферу и зал. Тренировка бесплатная и ни к чему не обязывает!
                  </p>
                </div>

                <div className="md:col-span-6">
                  <form onSubmit={handleFormSubmit} className="bg-white rounded-2xl p-6 text-slate-900 shadow-xl space-y-4">
                    <h4 className="font-extrabold text-lg text-slate-900 pb-2 border-b border-slate-100">
                      Форма быстрой записи
                    </h4>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Ваше имя (родитель) *
                      </label>
                      <input
                        type="text"
                        required
                        value={parentName}
                        onChange={(e) => setParentName(e.target.value)}
                        placeholder="Например, Александр"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Номер телефона для связи *
                      </label>
                      <input
                        type="tel"
                        required
                        value={parentPhone}
                        onChange={(e) => setParentPhone(e.target.value)}
                        placeholder="+7 (___) ___-__-__"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Имя ребенка
                        </label>
                        <input
                          type="text"
                          value={childName}
                          onChange={(e) => setChildName(e.target.value)}
                          placeholder="Артемий"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Возраст
                        </label>
                        <select
                          value={childAge}
                          onChange={(e) => setChildAge(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium bg-white"
                        >
                          <option value="4">4 года</option>
                          <option value="5">5 лет</option>
                          <option value="6">6 лет</option>
                          <option value="7">7 лет</option>
                          <option value="8">8 лет</option>
                          <option value="9">9 лет</option>
                          <option value="10">10 лет</option>
                          <option value="11">11 лет</option>
                          <option value="12">12 лет</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2 pt-1">
                      <input
                        type="checkbox"
                        id="blog-privacy"
                        checked={privacyAccepted}
                        onChange={(e) => setPrivacyAccepted(e.target.checked)}
                        className="mt-1 rounded text-red-600 focus:ring-red-500"
                      />
                      <label htmlFor="blog-privacy" className="text-[11px] text-slate-500 leading-tight">
                        Согласен на обработку персональных данных и звонок тренера школы
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || !privacyAccepted}
                      className="w-full py-3.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-red-600/30 flex items-center justify-center space-x-2 transition disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      <span>{isSubmitting ? "Отправляем..." : "Записаться на занятие"}</span>
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Articles */}
        <div className="mt-16 pt-10 border-t border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Читайте также в блоге
            </h3>
            <button
              onClick={onBackToBlog}
              className="text-xs sm:text-sm font-bold text-red-600 hover:text-red-700 transition"
            >
              Все статьи →
            </button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedArticles.map((rel) => (
              <div
                key={rel.id}
                onClick={() => onSelectArticle(rel)}
                className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-lg hover:border-red-500/30 transition cursor-pointer flex flex-col group"
              >
                <div className="h-36 overflow-hidden">
                  <img
                    src={rel.coverImage}
                    alt={rel.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase w-fit border ${rel.categoryColor}`}>
                    {rel.category}
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm line-clamp-2 group-hover:text-red-600 transition">
                    {rel.title}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                    <span>{rel.readTimeMinutes} мин чтения</span>
                    <span className="font-bold text-red-600">Читать →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-white mt-20 py-10 px-4 border-t border-slate-800 text-center sm:text-left">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6 text-xs text-slate-400">
          <div className="flex items-center space-x-3">
            <AmkarLogo className="w-8 h-8" />
            <div>
              <p className="font-bold text-white uppercase">{schoolName || "Амкар Юниор"} • Пермь</p>
              <p className="text-[11px]">Официальный блог детской футбольной школы</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={onBackToBlog} className="hover:text-white transition">
              Блог
            </button>
            <button onClick={onGoHome || onBackToBlog} className="hover:text-white transition">
              Главная
            </button>
            <a href="tel:+79991259055" className="hover:text-white transition font-bold text-slate-300">
              +7 (999) 125-90-55
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
