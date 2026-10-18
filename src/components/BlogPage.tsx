import React, { useState, useEffect } from "react";
import { BlogArticle, BLOG_ARTICLES, getArticleBySlug } from "../data/blogArticles";
import { BlogCard } from "./BlogCard";
import { ArticleView } from "./ArticleView";
import { BlogImageManagerModal } from "./BlogImageManagerModal";
import { useCRM } from "../context/CRMContext";
import { AmkarLogo } from "./AmkarLogo";
import {
  Search,
  BookOpen,
  MapPin,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  Award,
  Filter,
  Image as ImageIcon,
} from "lucide-react";

interface BlogPageProps {
  initialSlug?: string;
  onGoHome: () => void;
}

export const BlogPage: React.FC<BlogPageProps> = ({ initialSlug, onGoHome }) => {
  const { schoolName } = useCRM();
  const [selectedArticle, setSelectedArticle] = useState<BlogArticle | null>(() => {
    if (initialSlug) {
      return getArticleBySlug(initialSlug) || null;
    }
    // Also check current window path
    const path = window.location.pathname;
    if (path.startsWith("/blog/")) {
      const slug = path.replace("/blog/", "");
      return getArticleBySlug(slug) || null;
    }
    return null;
  });

  const [activeCategory, setActiveCategory] = useState<string>("Все");
  const [searchQuery, setSearchQuery] = useState("");
  const [showImageManager, setShowImageManager] = useState(false);

  const categories = [
    "Все",
    "Детский спорт",
    "Футбол в Перми",
    "Физическое развитие",
    "Примеры упражнений",
  ];

  // Listen to popstate for browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === "/blog" || path === "/blog/") {
        setSelectedArticle(null);
      } else if (path.startsWith("/blog/")) {
        const slug = path.replace("/blog/", "");
        setSelectedArticle(getArticleBySlug(slug) || null);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleSelectArticle = (article: BlogArticle) => {
    setSelectedArticle(article);
    window.history.pushState({}, "", `/blog/${article.slug}`);
  };

  const handleBackToBlog = () => {
    setSelectedArticle(null);
    window.history.pushState({}, "", "/blog");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (selectedArticle) {
    return (
      <ArticleView
        article={selectedArticle}
        onBackToBlog={handleBackToBlog}
        onSelectArticle={handleSelectArticle}
        onGoHome={onGoHome}
      />
    );
  }

  // Filtered articles
  const filteredArticles = BLOG_ARTICLES.filter((article) => {
    const matchCategory =
      activeCategory === "Все" || article.category === activeCategory;
    const matchSearch =
      !searchQuery.trim() ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.leadExcerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.keywords.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchSearch;
  });

  const featuredArticle = filteredArticles[0];
  const gridArticles = filteredArticles.slice(1);

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-red-500 selection:text-white">
      {/* Blog Top Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 px-4 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onGoHome}
              className="inline-flex items-center space-x-1.5 text-slate-600 hover:text-red-600 font-bold text-xs uppercase tracking-wider transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>На главную</span>
            </button>
            <div className="h-5 w-px bg-slate-200 hidden sm:block" />
            <div
              onClick={onGoHome}
              className="flex items-center space-x-2.5 cursor-pointer"
            >
              <AmkarLogo className="w-9 h-9" />
              <div>
                <span className="font-extrabold text-slate-900 text-sm tracking-tight uppercase block leading-none">
                  {schoolName || "АМКАР ЮНИОР"}
                </span>
                <span className="text-[11px] font-semibold text-red-600 tracking-wider uppercase">
                  Блог и база знаний
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => setShowImageManager(true)}
              title="Загрузка и управление фотографиями статей"
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center space-x-1.5 transition border border-slate-200"
            >
              <ImageIcon className="w-3.5 h-3.5 text-red-600" />
              <span className="hidden sm:inline">Фото статей</span>
            </button>

            <a
              href="/#trial-form"
              onClick={(e) => {
                e.preventDefault();
                onGoHome();
                setTimeout(() => {
                  document.getElementById("trial-form")?.scrollIntoView({ behavior: "smooth" });
                }, 100);
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition shadow-md shadow-red-600/20"
            >
              Бесплатная тренировка
            </a>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white pt-12 pb-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(220,38,38,0.18),transparent_50%)]" />

        <div className="max-w-7xl mx-auto relative z-10 space-y-6 text-center max-w-3xl">
          <div className="inline-flex items-center space-x-2 bg-red-500/20 text-red-400 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border border-red-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>База знаний для родителей юных футболистов</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight uppercase">
            Блог о детском футболе, <br />
            <span className="text-red-500">тренировках и спорте в Перми</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Советы лицензированных тренеров школы «Амкар Юниор»: физическое развитие мальчиков, качественные упражнения для дома и поля, выбор секции в районах Перми и психология побед.
          </p>

          {/* Search Bar */}
          <div className="pt-2 max-w-xl mx-auto">
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по статьям: Пермь, дриблинг, возраст 5 лет, осанка..."
                className="w-full pl-12 pr-4 py-3.5 bg-slate-800/90 border border-slate-700 rounded-2xl text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  Очистить
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 py-10 space-y-10">
        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0 mr-1" />
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition whitespace-nowrap ${
                  isActive
                    ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Search Results Count */}
        {searchQuery && (
          <p className="text-xs text-slate-500">
            Найдено статей по запросу «{searchQuery}»: <span className="font-bold text-slate-900">{filteredArticles.length}</span>
          </p>
        )}

        {filteredArticles.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/80 p-8 space-y-4">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-xl font-bold text-slate-800">
              Статьи не найдены
            </h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              Попробуйте изменить поисковый запрос или выбрать другую категорию.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveCategory("Все");
              }}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
            >
              Сбросить фильтры
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Featured Article */}
            {featuredArticle && !searchQuery && activeCategory === "Все" && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-red-600">
                  <TrendingUp className="w-4 h-4" />
                  <span>Главный материал</span>
                </div>
                <BlogCard
                  article={featuredArticle}
                  onSelect={handleSelectArticle}
                  featured={true}
                />
              </div>
            )}

            {/* Grid of Articles */}
            <div className="space-y-4">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {activeCategory === "Все" && !searchQuery
                  ? "Все материалы блога"
                  : `Статьи: ${activeCategory}`}
              </h3>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {(searchQuery || activeCategory !== "Все"
                  ? filteredArticles
                  : gridArticles
                ).map((article) => (
                  <BlogCard
                    key={article.id}
                    article={article}
                    onSelect={handleSelectArticle}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Geo Perm Box */}
        <section className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-sm grid md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-8 space-y-3">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-bold uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5" />
              <span>Детский спорт в Перми</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Хотите увидеть результаты своими глазами?
            </h3>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Приводите сына на бесплатную пробную тренировку в «Амкар Юниор» Пермь. Оцените работу тренеров, теплоту манежа и горящие глаза ребенка уже на первом занятии!
            </p>
            <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1 pt-1">
              <span>📍 Мотовилиха</span>
              <span>📍 Свердловский р-н</span>
              <span>📍 Индустриальный р-н</span>
              <span>📍 Дзержинский р-н</span>
            </div>
          </div>

          <div className="md:col-span-4 flex justify-start md:justify-end">
            <button
              onClick={() => {
                onGoHome();
                setTimeout(() => {
                  document.getElementById("trial-form")?.scrollIntoView({ behavior: "smooth" });
                }, 100);
              }}
              className="w-full sm:w-auto px-6 py-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-red-600/25 transition text-center"
            >
              Записаться на занятие
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-white py-12 px-4 mt-20 border-t border-slate-900">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6 text-xs text-slate-400">
          <div className="flex items-center space-x-3">
            <AmkarLogo className="w-9 h-9" />
            <div>
              <p className="font-bold text-white text-sm uppercase">
                {schoolName || "АМКАР ЮНИОР"} • Пермь
              </p>
              <p className="text-slate-500">
                Детская футбольная школа • Набор мальчиков от 4 до 12 лет
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-6 text-xs">
            <button onClick={onGoHome} className="hover:text-white transition">
              Главная страница
            </button>
            <a href="tel:+79991259055" className="hover:text-white font-bold text-slate-200">
              +7 (999) 125-90-55
            </a>
          </div>
        </div>
      </footer>

      {/* Image Manager Modal */}
      <BlogImageManagerModal
        isOpen={showImageManager}
        onClose={() => setShowImageManager(false)}
      />
    </div>
  );
};
