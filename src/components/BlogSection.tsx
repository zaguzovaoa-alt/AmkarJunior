import React, { useState } from "react";
import { BlogArticle, BLOG_ARTICLES } from "../data/blogArticles";
import { BlogCard } from "./BlogCard";
import { Sparkles, ArrowRight, BookOpen, MapPin } from "lucide-react";

interface BlogSectionProps {
  onOpenArticle: (article: BlogArticle) => void;
  onOpenBlog: () => void;
}

export const BlogSection: React.FC<BlogSectionProps> = ({
  onOpenArticle,
  onOpenBlog,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>("Все");

  const categories = [
    "Все",
    "Детский спорт",
    "Футбол в Перми",
    "Физическое развитие",
    "Примеры упражнений",
  ];

  const filtered = BLOG_ARTICLES.filter(
    (a) => activeCategory === "Все" || a.category === activeCategory
  );

  return (
    <section id="blog" className="py-20 lg:py-28 px-4 bg-slate-100/80 border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-red-600/10 text-red-600 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border border-red-600/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>База знаний юного футболиста</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight uppercase leading-tight">
              Блог о детском футболе <br />
              <span className="text-red-600">и тренировках в Перми</span>
            </h2>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Полезные статьи от наших тренеров: возрастные особенности, выбор секции в Перми, физическая подготовка мальчиков и проверенные упражнения с мячом.
            </p>
          </div>

          <div className="flex-shrink-0">
            <button
              onClick={onOpenBlog}
              className="inline-flex items-center space-x-2 px-5 py-3 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-900 border border-slate-200 font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm transition hover:border-red-500/50 hover:text-red-600 group"
            >
              <BookOpen className="w-4 h-4 text-red-600" />
              <span>Все статьи блога</span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-red-600 transition" />
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition whitespace-nowrap ${
                  isActive
                    ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                    : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Article Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((article) => (
            <BlogCard
              key={article.id}
              article={article}
              onSelect={onOpenArticle}
            />
          ))}
        </div>

        {/* Quick CTA strip */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl border border-slate-800">
          <div className="space-y-1.5 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start space-x-2 text-xs text-red-400 font-bold uppercase tracking-wider">
              <MapPin className="w-4 h-4" />
              <span>Пермь • Набор мальчиков от 4 до 12 лет</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black">
              Хотите попробовать тренировку на практике?
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm">
              Первое пробное занятие в футбольной школе «Амкар Юниор» бесплатное.
            </p>
          </div>

          <a
            href="#trial-form"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("trial-form")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="w-full sm:w-auto px-6 py-3.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-red-600/25 whitespace-nowrap text-center"
          >
            Записаться на пробное
          </a>
        </div>
      </div>
    </section>
  );
};
