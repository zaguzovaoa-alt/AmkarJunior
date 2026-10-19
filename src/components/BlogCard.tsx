import React from "react";
import { BlogArticle } from "../data/blogArticles";
import { Clock, Calendar, ArrowRight } from "lucide-react";

interface BlogCardProps {
  article: BlogArticle;
  onSelect: (article: BlogArticle) => void;
  featured?: boolean;
}

export const BlogCard: React.FC<BlogCardProps> = ({
  article,
  onSelect,
  featured = false,
}) => {
  const formattedDate = new Date(article.publishedAt).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const [imgSrc, setImgSrc] = React.useState(article.coverImage);

  React.useEffect(() => {
    setImgSrc(article.coverImage);
  }, [article.coverImage]);

  const handleImgError = () => {
    if (article.fallbackImage && imgSrc !== article.fallbackImage) {
      setImgSrc(article.fallbackImage);
    } else if (imgSrc !== "/kids_football.png") {
      setImgSrc("/kids_football.png");
    }
  };

  if (featured) {
    return (
      <article
        onClick={() => onSelect(article)}
        className="group relative bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-xl shadow-slate-900/5 hover:shadow-2xl hover:shadow-red-500/10 hover:border-red-500/40 transition-all duration-300 cursor-pointer grid lg:grid-cols-12 gap-0"
      >
        <div className="lg:col-span-7 relative min-h-[280px] lg:min-h-[420px] overflow-hidden bg-slate-100">
          <img
            src={imgSrc}
            alt={article.title}
            onError={handleImgError}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            loading="eager"
            decoding="async"
          />
        </div>

        <div className="lg:col-span-5 p-6 lg:p-10 flex flex-col justify-between bg-white">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${article.categoryColor}`}
              >
                {article.category}
              </span>
            </div>

            <h3 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight leading-snug group-hover:text-red-600 transition-colors">
              {article.title}
            </h3>

            <p className="text-slate-600 text-sm lg:text-base line-clamp-3 leading-relaxed">
              {article.leadExcerpt}
            </p>
          </div>

          <div className="pt-6 border-t border-slate-100 mt-6 flex items-center justify-between">
            <div className="flex items-center space-x-4 text-xs text-slate-500">
              <span className="flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formattedDate}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{article.readTimeMinutes} мин чтения</span>
              </span>
            </div>

            <div className="inline-flex items-center space-x-1 text-sm font-bold text-red-600 group-hover:translate-x-1 transition-transform">
              <span>Читать</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      onClick={() => onSelect(article)}
      className="group bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-xl hover:shadow-red-500/10 hover:border-red-500/40 transition-all duration-300 cursor-pointer flex flex-col h-full"
    >
      <div className="relative h-48 overflow-hidden bg-slate-100">
        <img
          src={imgSrc}
          alt={article.title}
          onError={handleImgError}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          decoding="async"
        />
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div className="space-y-2.5">
          <div className="flex items-center">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${article.categoryColor}`}
            >
              {article.category}
            </span>
          </div>

          <h3 className="font-extrabold text-slate-900 text-lg leading-snug group-hover:text-red-600 transition-colors line-clamp-2">
            {article.title}
          </h3>
          <p className="text-slate-600 text-xs sm:text-sm line-clamp-3 leading-relaxed">
            {article.leadExcerpt}
          </p>
        </div>

        <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{article.readTimeMinutes} мин</span>
            </span>
            <span>•</span>
            <span>{formattedDate}</span>
          </div>

          <span className="font-bold text-red-600 flex items-center space-x-0.5 group-hover:translate-x-1 transition-transform">
            <span>Статья</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </article>
  );
};
