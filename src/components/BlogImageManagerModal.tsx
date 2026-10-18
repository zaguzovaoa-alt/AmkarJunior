import React, { useState, useRef } from "react";
import { BLOG_ARTICLES, BlogArticle } from "../data/blogArticles";
import {
  X,
  Upload,
  CheckCircle2,
  Image as ImageIcon,
  RefreshCw,
  AlertCircle,
  FileCheck,
} from "lucide-react";

interface BlogImageManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageUpdated?: () => void;
}

export const BlogImageManagerModal: React.FC<BlogImageManagerModalProps> = ({
  isOpen,
  onClose,
  onImageUpdated,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedArticleId, setSelectedArticleId] = useState<string>("all");

  if (!isOpen) return null;

  const handleFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadStatus("Загрузка и обработка фотографий...");

    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const base64 = await readFileAsBase64(file);
        
        let targetFilename = file.name;
        // If single article selected and target doesn't specify number, map it
        if (selectedArticleId !== "all") {
          const artNum = selectedArticleId.replace("art-", "");
          targetFilename = `amkar-${artNum}.jpg`;
        }

        const res = await fetch("/api/upload-blog-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: targetFilename,
            base64: base64,
          }),
        });

        if (res.ok) {
          successCount++;
        }
      } catch (err) {
        console.error("Upload error for file", file.name, err);
      }
    }

    setUploading(false);
    setUploadedCount((prev) => prev + successCount);
    setUploadStatus(`Успешно загружено и применено фотографий: ${successCount} из ${files.length}`);
    if (onImageUpdated) {
      onImageUpdated();
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600/10 text-red-600 flex items-center justify-center">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Управление фото блога «Амкар Юниор»
              </h2>
              <p className="text-xs text-slate-500">
                Загрузите фотографии (Амкар1.jfif — Амкар15.jpg), они органично привяжутся к статьям блога
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Dropzone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center space-y-3 ${
              dragActive
                ? "border-red-500 bg-red-50/50 scale-[1.01]"
                : "border-slate-300 hover:border-red-400 hover:bg-slate-50/80"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.jfif"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleFiles(e.target.files);
              }}
            />

            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
              {uploading ? (
                <RefreshCw className="w-6 h-6 animate-spin text-red-600" />
              ) : (
                <Upload className="w-6 h-6" />
              )}
            </div>

            <div>
              <p className="text-sm font-bold text-slate-800">
                Перетащите сюда фотографии или нажмите для выбора
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Поддерживаются форматы JPG, PNG, WEBP, JFIF. Можно выбрать все 15 фото разом.
              </p>
            </div>

            {uploadStatus && (
              <div className="inline-flex items-center space-x-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{uploadStatus}</span>
              </div>
            )}
          </div>

          {/* Quick Info */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs text-slate-600 space-y-1">
            <p className="font-bold text-slate-800 flex items-center space-x-1.5">
              <FileCheck className="w-4 h-4 text-red-600" />
              <span>Автоматическое сопоставление по имени файла:</span>
            </p>
            <p>
              Файлы <b>Амкар1.jfif / Амкар1.jpg</b> автоматически привязываются к Статье №1 («Детский футбол с 4–7 лет»), 
              <b> Амкар2</b> — к Статье №2 («Футбол в Перми»), и так далее до Статьи №16.
            </p>
          </div>

          {/* Articles Grid Preview */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Текущие обложки статей (16 материалов):
            </h3>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {BLOG_ARTICLES.map((article, idx) => (
                <div
                  key={article.id}
                  className="bg-white rounded-2xl p-2.5 border border-slate-200/80 shadow-sm flex items-center space-x-3 hover:border-slate-300 transition"
                >
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 relative">
                    <img
                      src={`${article.coverImage}?t=${uploadedCount}`}
                      alt={article.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = article.fallbackImage || "/kids_football.png";
                      }}
                    />
                    <span className="absolute bottom-0.5 right-0.5 bg-slate-900/80 text-white text-[9px] font-bold px-1 rounded">
                      #{idx + 1}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-slate-900 line-clamp-2 leading-tight">
                      {article.title}
                    </p>
                    <span className="text-[9px] text-slate-500 block truncate mt-0.5">
                      {article.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <p className="text-xs text-slate-500">
            Все изображения отдаются с правильными заголовками и моментально отображаются в блоге.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
};
