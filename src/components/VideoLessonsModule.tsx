import React, { useState, useRef, useMemo } from "react";
import { useCRM } from "../context/CRMContext";
import { useAuth } from "../context/AuthContext";
import { VideoLesson } from "../types";
import {
  VIDEO_LESSON_CATEGORIES,
  VIDEO_LESSON_AGE_GROUPS,
  VIDEO_LESSON_COVER_PRESETS,
} from "../data/initialVideoLessons";
import { compressImage } from "../utils/image";
import {
  Play,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  Clock,
  Eye,
  Heart,
  Sparkles,
  Upload,
  ExternalLink,
  Pin,
  CheckCircle2,
  Film,
  BookOpen,
  SlidersHorizontal,
  ShieldCheck,
} from "lucide-react";

export interface ParsedVideoSource {
  type: "html5" | "iframe";
  src: string;
  providerLabel: string;
  autoThumbnail?: string;
}

export function parseVideoSource(rawUrl: string): ParsedVideoSource {
  const url = (rawUrl || "").trim();
  if (!url) {
    return { type: "html5", src: "", providerLabel: "Видео" };
  }

  // 1. Direct HTML5 video files or data/blob URLs
  if (
    url.startsWith("data:video/") ||
    url.startsWith("blob:") ||
    /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url)
  ) {
    return {
      type: "html5",
      src: url,
      providerLabel: "Прямой видеопоток HD",
    };
  }

  // 2. If user pasted full <iframe ... src="..."> snippet, extract src
  if (url.includes("<iframe")) {
    const srcMatch = url.match(/src=["']([^"']+)["']/i);
    if (srcMatch && srcMatch[1]) {
      return parseVideoSource(srcMatch[1]);
    }
  }

  // 3. YouTube (watch?v=, youtu.be/, shorts/, embed/)
  const ytMatch =
    url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i,
    ) || url.match(/[?&]v=([A-Za-z0-9_-]{11})/i);
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      type: "iframe",
      src: `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`,
      providerLabel: "YouTube",
      autoThumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    };
  }

  // 4. Rutube (rutube.ru/video/<id> or rutube.ru/play/embed/<id> or rutube.ru/shorts/<id>)
  const rutubeEmbedMatch = url.match(
    /rutube\.ru\/(?:video\/|play\/embed\/|shorts\/)([a-zA-Z0-9_-]+)/i,
  );
  if (rutubeEmbedMatch && rutubeEmbedMatch[1]) {
    const rtId = rutubeEmbedMatch[1];
    return {
      type: "iframe",
      src: `https://rutube.ru/play/embed/${rtId}`,
      providerLabel: "Rutube",
    };
  }

  // 5. VK Video (vk.com/video-123_456, vkvideo.ru/video-123_456, vk.com/clip-123_456, or video_ext.php)
  if (url.includes("video_ext.php")) {
    return {
      type: "iframe",
      src: url,
      providerLabel: "VK Видео",
    };
  }
  const vkMatch = url.match(/(?:video|clip)(-?\d+)_(\d+)/i);
  if (vkMatch && vkMatch[1] && vkMatch[2]) {
    return {
      type: "iframe",
      src: `https://vk.com/video_ext.php?oid=${vkMatch[1]}&id=${vkMatch[2]}&hd=2`,
      providerLabel: "VK Видео",
    };
  }

  // 6. Kinescope (kinescope.io/<id> or kinescope.io/embed/<id>)
  const kinescopeMatch = url.match(
    /kinescope\.io\/(?:embed\/)?([a-zA-Z0-9_-]+)/i,
  );
  if (kinescopeMatch && kinescopeMatch[1]) {
    return {
      type: "iframe",
      src: `https://kinescope.io/embed/${kinescopeMatch[1]}`,
      providerLabel: "Kinescope",
    };
  }

  // 7. Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      type: "iframe",
      src: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
      providerLabel: "Vimeo",
    };
  }

  // 8. Google Drive file link
  const gdriveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/i);
  if (gdriveMatch && gdriveMatch[1]) {
    return {
      type: "iframe",
      src: `https://drive.google.com/file/d/${gdriveMatch[1]}/preview`,
      providerLabel: "Google Drive",
    };
  }

  // Default fallback: if it looks like an embed url, use iframe; otherwise html5 video
  if (url.includes("embed") || url.includes("player")) {
    return {
      type: "iframe",
      src: url,
      providerLabel: "Видеоплеер",
    };
  }

  return {
    type: "html5",
    src: url,
    providerLabel: "Видео",
  };
}

interface VideoLessonsModuleProps {
  clientId?: string;
  childName?: string;
}

export const VideoLessonsModule: React.FC<VideoLessonsModuleProps> = ({
  clientId = "default",
  childName,
}) => {
  const {
    videoLessons,
    addVideoLesson,
    updateVideoLesson,
    deleteVideoLesson,
    incrementVideoLessonViews,
    currentRole,
    userProfile,
  } = useCRM();
  const { appUser } = useAuth();

  // Can manage: director or admin (either by active role or logged-in appUser role)
  const canManage =
    currentRole === "director" ||
    currentRole === "admin" ||
    appUser?.role === "director" ||
    appUser?.role === "admin";

  // Active video in theater player
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(() =>
    videoLessons.length > 0 ? videoLessons[0].id : null,
  );
  const [activeCategory, setActiveCategory] = useState<string>("Все рубрики");
  const [activeAgeGroup, setActiveAgeGroup] = useState<string>("Все возрасты");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showSavedOnly, setShowSavedOnly] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);

  // Saved / Watched states for parent/student
  const [savedLessonIds, setSavedLessonIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(`amkar_vl_saved_${clientId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [watchedLessonIds, setWatchedLessonIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(`amkar_vl_watched_${clientId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Admin / Director Form Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingLesson, setEditingLesson] = useState<VideoLesson | null>(null);
  const [formTitle, setFormTitle] = useState<string>("");
  const [formDescription, setFormDescription] = useState<string>("");
  const [formVideoUrl, setFormVideoUrl] = useState<string>("");
  const [formThumbnailUrl, setFormThumbnailUrl] = useState<string>(
    VIDEO_LESSON_COVER_PRESETS[0].url,
  );
  const [formCategory, setFormCategory] = useState<string>(
    VIDEO_LESSON_CATEGORIES[0],
  );
  const [formDuration, setFormDuration] = useState<string>("05:00");
  const [formAgeGroup, setFormAgeGroup] = useState<string>(
    VIDEO_LESSON_AGE_GROUPS[0],
  );
  const [formCoachTips, setFormCoachTips] = useState<string>("");
  const [formIsPinned, setFormIsPinned] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const videoFileInputRef = useRef<HTMLInputElement | null>(null);
  const playerSectionRef = useRef<HTMLDivElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const toggleSaveLesson = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSavedLessonIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id];
      try {
        localStorage.setItem(`amkar_vl_saved_${clientId}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const toggleWatchedLesson = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setWatchedLessonIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id];
      try {
        localStorage.setItem(
          `amkar_vl_watched_${clientId}`,
          JSON.stringify(next),
        );
      } catch {}
      return next;
    });
  };

  const handleSelectLesson = (lesson: VideoLesson, scrollToPlayer = true) => {
    setSelectedLessonId(lesson.id);
    setPlaybackRate(1);
    incrementVideoLessonViews(lesson.id);
    if (scrollToPlayer) {
      setTimeout(() => {
        playerSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 60);
    }
  };

  const handlePlaybackSpeedChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoElementRef.current) {
      videoElementRef.current.playbackRate = rate;
    }
  };

  const filteredLessons = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return videoLessons.filter((lesson) => {
      if (showSavedOnly && !savedLessonIds.includes(lesson.id)) return false;
      if (
        activeCategory !== "Все рубрики" &&
        lesson.category !== activeCategory
      ) {
        return false;
      }
      if (
        activeAgeGroup !== "Все возрасты" &&
        lesson.ageGroup &&
        lesson.ageGroup !== activeAgeGroup &&
        !lesson.ageGroup.startsWith("Все возрасты")
      ) {
        return false;
      }
      if (!q) return true;
      return (
        lesson.title.toLowerCase().includes(q) ||
        lesson.description.toLowerCase().includes(q) ||
        (lesson.category || "").toLowerCase().includes(q) ||
        (lesson.coachTips || "").toLowerCase().includes(q)
      );
    });
  }, [
    videoLessons,
    showSavedOnly,
    savedLessonIds,
    activeCategory,
    activeAgeGroup,
    searchQuery,
  ]);

  const activeLesson = useMemo(() => {
    if (selectedLessonId) {
      const found = videoLessons.find((l) => l.id === selectedLessonId);
      if (found) return found;
    }
    return filteredLessons[0] || videoLessons[0] || null;
  }, [selectedLessonId, videoLessons, filteredLessons]);

  const openCreateModal = () => {
    setEditingLesson(null);
    setFormTitle("");
    setFormDescription("");
    setFormVideoUrl("");
    setFormThumbnailUrl(VIDEO_LESSON_COVER_PRESETS[0].url);
    setFormCategory(VIDEO_LESSON_CATEGORIES[0]);
    setFormDuration("05:00");
    setFormAgeGroup(VIDEO_LESSON_AGE_GROUPS[0]);
    setFormCoachTips("");
    setFormIsPinned(false);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (lesson: VideoLesson, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingLesson(lesson);
    setFormTitle(lesson.title);
    setFormDescription(lesson.description);
    setFormVideoUrl(lesson.videoUrl);
    setFormThumbnailUrl(
      lesson.thumbnailUrl || VIDEO_LESSON_COVER_PRESETS[0].url,
    );
    setFormCategory(lesson.category || VIDEO_LESSON_CATEGORIES[0]);
    setFormDuration(lesson.duration || "05:00");
    setFormAgeGroup(lesson.ageGroup || VIDEO_LESSON_AGE_GROUPS[0]);
    setFormCoachTips(lesson.coachTips || "");
    setFormIsPinned(Boolean(lesson.isPinned));
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 900, 0.75);
      setFormThumbnailUrl(compressed);
    } catch (err) {
      console.error("Failed to compress cover image:", err);
    } finally {
      e.target.value = "";
    }
  };

  const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Check size: if under 700KB, store as data URL for Firestore persistence; otherwise warn or use object URL / link
    if (file.size > 750 * 1024) {
      setFormError(
        "Видеофайл превышает 750 КБ для прямой записи в облачную БД. Рекомендуем загрузить ролик на YouTube, VK Видео, Rutube, Kinescope или Google Диск и вставить ссылку — плеер воспроизведет его автоматически.",
      );
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) {
        setFormVideoUrl(dataUrl);
        setFormError(null);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError("Пожалуйста, укажите название видеоурока.");
      return;
    }
    if (!formDescription.trim()) {
      setFormError("Пожалуйста, добавьте описание и рекомендации к видеоуроку.");
      return;
    }
    if (!formVideoUrl.trim()) {
      setFormError("Пожалуйста, укажите ссылку на видеоурок.");
      return;
    }

    setIsSaving(true);
    setFormError(null);

    const parsedPreview = parseVideoSource(formVideoUrl.trim());
    const finalThumbnail =
      formThumbnailUrl.trim() ||
      parsedPreview.autoThumbnail ||
      VIDEO_LESSON_COVER_PRESETS[0].url;

    const authorRoleLabel =
      currentRole === "admin" || appUser?.role === "admin"
        ? "Администратор"
        : "Директор";
    const rawAuthorName =
      userProfile?.name || appUser?.fullName || "Штаб «Амкар Юниор»";

    try {
      if (editingLesson) {
        await updateVideoLesson(editingLesson.id, {
          title: formTitle.trim(),
          description: formDescription.trim(),
          videoUrl: formVideoUrl.trim(),
          thumbnailUrl: finalThumbnail,
          category: formCategory,
          duration: formDuration.trim() || "05:00",
          ageGroup: formAgeGroup,
          coachTips: formCoachTips.trim() || undefined,
          isPinned: formIsPinned,
        });
        setSelectedLessonId(editingLesson.id);
        showToast(`Видеоурок «${formTitle.trim()}» успешно обновлен!`);
      } else {
        const created = await addVideoLesson({
          title: formTitle.trim(),
          description: formDescription.trim(),
          videoUrl: formVideoUrl.trim(),
          thumbnailUrl: finalThumbnail,
          category: formCategory,
          duration: formDuration.trim() || "05:00",
          ageGroup: formAgeGroup,
          coachTips: formCoachTips.trim() || undefined,
          authorName: `${authorRoleLabel} • ${rawAuthorName}`,
          authorRole:
            currentRole === "admin" || appUser?.role === "admin"
              ? "admin"
              : "director",
          isPinned: formIsPinned,
        });
        setSelectedLessonId(created.id);
        showToast(
          `Видеоурок «${created.title}» опубликован и сразу доступен родителям!`,
        );
      }
      setIsFormModalOpen(false);
      setEditingLesson(null);
    } catch (err: any) {
      setFormError(err?.message || "Ошибка при сохранении видеоурока.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async (id: string, title: string) => {
    await deleteVideoLesson(id);
    setConfirmDeleteId(null);
    if (selectedLessonId === id) {
      const remaining = videoLessons.filter((l) => l.id !== id);
      setSelectedLessonId(remaining[0]?.id || null);
    }
    showToast(`Видеоурок «${title}» удален из базы знаний.`);
  };

  const activeParsedVideo = activeLesson
    ? parseVideoSource(activeLesson.videoUrl)
    : null;

  return (
    <div className="space-y-6 text-left relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 text-xs font-bold">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white border border-slate-800 shadow-lg p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-red-600/15 blur-3xl" />
        <div className="pointer-events-none absolute left-1/3 -bottom-20 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>LIVE • Видеотека в реальном времени</span>
              </span>
              <span className="text-slate-400 font-mono tabular-nums">
                Доступно уроков: {videoLessons.length}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-amber-300 font-mono tabular-nums">
                Освоено вами: {watchedLessonIds.length} из {videoLessons.length}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
              Видеоуроки академии «Амкар Юниор»
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Наглядные видеоразборы упражнений на технику, дриблинг, координацию и
              домашнюю разминку от тренерского штаба и руководства школы.{" "}
              {childName ? (
                <>
                  Включайте уроки вместе с{" "}
                  <strong className="text-white">{childName}</strong>, используйте
                  замедленный повтор для разбора движений стопы и отмечайте
                  изученные элементы!
                </>
              ) : (
                <>
                  Все добавленные директором и администратором видеоуроки
                  мгновенно синхронизируются в кабинетах родителей.
                </>
              )}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
            {canManage ? (
              <button
                type="button"
                onClick={openCreateModal}
                className="px-5 py-3.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-2xl font-extrabold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-red-600/25 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Разместить видеоурок</span>
              </button>
            ) : null}

            <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
                <Film className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-white">
                  {canManage
                    ? "Режим управления видеотекой"
                    : "Удобный видеоплеер"}
                </div>
                <div className="text-[11px] text-slate-400">
                  {canManage
                    ? "Публикация, редактирование и закрепление уроков"
                    : "Поддержка замедления 0.5x для разбора техники"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Featured / Active Video Theater Player */}
      {activeLesson && activeParsedVideo && (
        <div
          ref={playerSectionRef}
          className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Left 7 cols: Video Player Canvas */}
            <div className="lg:col-span-7 bg-slate-950 flex flex-col justify-between relative min-h-[280px] sm:min-h-[380px]">
              <div className="relative w-full aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
                {activeParsedVideo.type === "html5" ? (
                  <video
                    key={activeLesson.id + "_" + activeParsedVideo.src}
                    ref={videoElementRef}
                    src={activeParsedVideo.src}
                    poster={activeLesson.thumbnailUrl}
                    controls
                    playsInline
                    preload="metadata"
                    onEnded={() => {
                      if (!watchedLessonIds.includes(activeLesson.id)) {
                        toggleWatchedLesson(activeLesson.id);
                      }
                    }}
                    className="w-full h-full object-contain bg-black"
                  />
                ) : (
                  <iframe
                    key={activeLesson.id + "_" + activeParsedVideo.src}
                    src={activeParsedVideo.src}
                    title={activeLesson.title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                    allowFullScreen
                  />
                )}
              </div>

              {/* Player Controls Bar (Speed control for HTML5 + Provider Info + Direct Link) */}
              <div className="px-4 py-3 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono text-[11px] font-semibold">
                    {activeParsedVideo.providerLabel}
                  </span>
                  {activeLesson.duration && (
                    <span className="text-slate-400 font-mono tabular-nums flex items-center gap-1 text-[11px]">
                      <Clock className="w-3 h-3" />
                      <span>{activeLesson.duration}</span>
                    </span>
                  )}
                </div>

                {activeParsedVideo.type === "html5" && (
                  <div className="flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[11px] text-slate-400 mr-1">
                      Скорость разбора:
                    </span>
                    {[
                      { rate: 0.5, label: "0.5x (Пошагово)" },
                      { rate: 0.75, label: "0.75x" },
                      { rate: 1, label: "1x" },
                      { rate: 1.25, label: "1.25x" },
                    ].map((s) => (
                      <button
                        key={s.rate}
                        type="button"
                        onClick={() => handlePlaybackSpeedChange(s.rate)}
                        className={`px-2 py-1 rounded text-[11px] font-mono font-bold transition cursor-pointer ${
                          playbackRate === s.rate
                            ? "bg-emerald-500 text-slate-950"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}

                {!activeLesson.videoUrl.startsWith("data:") && (
                  <a
                    href={activeLesson.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition ml-auto"
                  >
                    <span>Открыть источник</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Right 5 cols: Active Video Lesson Details & Coaching Tips */}
            <div className="lg:col-span-5 p-6 flex flex-col justify-between space-y-5 bg-white">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold text-[11px]">
                      {activeLesson.category}
                    </span>
                    {activeLesson.ageGroup && (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-semibold text-[11px]">
                        {activeLesson.ageGroup}
                      </span>
                    )}
                    {activeLesson.isPinned && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center gap-1">
                        <Pin className="w-3 h-3" />
                        <span>Рекомендуем</span>
                      </span>
                    )}
                  </div>

                  {canManage && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => openEditModal(activeLesson, e)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                        title="Редактировать видеоурок"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(activeLesson.id)}
                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                        title="Удалить видеоурок"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                    {activeLesson.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 font-mono">
                    <span>{activeLesson.authorName}</span>
                    <span>·</span>
                    <span>
                      {new Date(activeLesson.createdAt).toLocaleDateString(
                        "ru-RU",
                        {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        },
                      )}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1 tabular-nums">
                      <Eye className="w-3 h-3" />
                      <span>{activeLesson.viewsCount || 1} просм.</span>
                    </span>
                  </div>
                </div>

                {/* Detailed Description */}
                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
                  {activeLesson.description}
                </div>

                {/* Coach Tips for Parents */}
                {activeLesson.coachTips && (
                  <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-1.5">
                    <div className="text-xs font-extrabold text-amber-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>На что обратить внимание родителю и игроку:</span>
                    </div>
                    <p className="text-xs text-amber-950/90 leading-relaxed">
                      {activeLesson.coachTips}
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom Actions Bar for Active Lesson */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => toggleWatchedLesson(activeLesson.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    watchedLessonIds.includes(activeLesson.id)
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-slate-900 hover:bg-slate-800 text-white"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {watchedLessonIds.includes(activeLesson.id)
                      ? "Урок изучен"
                      : "Отметить как изученный"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={(e) => toggleSaveLesson(activeLesson.id, e)}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                    savedLessonIds.includes(activeLesson.id)
                      ? "bg-amber-50 text-amber-800 border-amber-300"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <Heart
                    className={`w-3.5 h-3.5 ${
                      savedLessonIds.includes(activeLesson.id)
                        ? "fill-current text-amber-500"
                        : ""
                    }`}
                  />
                  <span>
                    {savedLessonIds.includes(activeLesson.id)
                      ? "В закладках"
                      : "Сохранить"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск видеоурока по названию или описанию: дриблинг, маятник, передача, разминка..."
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-900 rounded-xl text-xs text-slate-800 outline-none transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Age Group Filter & Bookmarks Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={activeAgeGroup}
              onChange={(e) => setActiveAgeGroup(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="Все возрасты">Все возрастные группы</option>
              {VIDEO_LESSON_AGE_GROUPS.map((ag) => (
                <option key={ag} value={ag}>
                  {ag}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setShowSavedOnly((prev) => !prev)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                showSavedOnly
                  ? "bg-amber-500 text-white"
                  : "bg-slate-100 text-slate-600 hover:text-slate-900"
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span>Избранные ({savedLessonIds.length})</span>
            </button>

            {canManage && (
              <button
                type="button"
                onClick={openCreateModal}
                className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Добавить урок</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {["Все рубрики", ...VIDEO_LESSON_CATEGORIES].map((cat) => {
            const isSelected = activeCategory === cat;
            const count =
              cat === "Все рубрики"
                ? videoLessons.length
                : videoLessons.filter((l) => l.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`font-mono text-[10px] tabular-nums ${
                    isSelected ? "text-amber-300" : "text-slate-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Grid of Video Lessons */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900">
            {showSavedOnly
              ? "Сохраненные видеоуроки"
              : activeCategory === "Все рубрики"
                ? "Все видеоуроки в базе знаний"
                : `Рубрика: ${activeCategory}`}
          </h3>
          <span className="text-xs text-slate-500 font-mono tabular-nums">
            Показано: {filteredLessons.length} из {videoLessons.length}
          </span>
        </div>

        {filteredLessons.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 border border-gray-200/80 text-center space-y-3">
            <Film className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="text-sm font-bold text-slate-800">
              Видеоуроки по выбранным параметрам не найдены
            </div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Попробуйте сбросить фильтры поиска или выберите другую рубрику
              видеотеки.
            </p>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setActiveCategory("Все рубрики");
                  setActiveAgeGroup("Все возрасты");
                  setSearchQuery("");
                  setShowSavedOnly(false);
                }}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Сбросить фильтры
              </button>
              {canManage && (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Разместить видеоурок</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredLessons.map((lesson) => {
              const isPlaying = activeLesson?.id === lesson.id;
              const isWatched = watchedLessonIds.includes(lesson.id);
              const isSaved = savedLessonIds.includes(lesson.id);
              const parsed = parseVideoSource(lesson.videoUrl);
              const coverImg =
                lesson.thumbnailUrl ||
                parsed.autoThumbnail ||
                VIDEO_LESSON_COVER_PRESETS[0].url;

              return (
                <div
                  key={lesson.id}
                  onClick={() => handleSelectLesson(lesson, true)}
                  className={`bg-white rounded-2xl border transition cursor-pointer overflow-hidden flex flex-col justify-between group ${
                    isPlaying
                      ? "border-red-600 ring-2 ring-red-600/20 shadow-md"
                      : "border-gray-200/80 hover:border-slate-400 shadow-2xs"
                  }`}
                >
                  <div>
                    {/* Thumbnail Cover */}
                    <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                      <img
                        src={coverImg}
                        alt={lesson.title}
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent" />

                      {/* Center Play Button Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center transition transform group-hover:scale-110 shadow-lg ${
                            isPlaying
                              ? "bg-red-600 text-white"
                              : "bg-white/95 text-slate-950 group-hover:bg-red-600 group-hover:text-white"
                          }`}
                        >
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        </div>
                      </div>

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {lesson.isPinned && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-extrabold text-[10px] flex items-center gap-1 shadow-xs">
                              <Pin className="w-2.5 h-2.5" />
                              <span>Важное</span>
                            </span>
                          )}
                          {isPlaying && (
                            <span className="px-2 py-0.5 rounded-md bg-red-600 text-white font-bold text-[10px]">
                              Сейчас на экране
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => toggleSaveLesson(lesson.id, e)}
                          className={`p-2 rounded-xl backdrop-blur-md border transition cursor-pointer ${
                            isSaved
                              ? "bg-amber-500 text-white border-amber-400"
                              : "bg-slate-900/60 text-white/90 border-white/20 hover:bg-slate-900"
                          }`}
                          title={
                            isSaved
                              ? "Убрать из закладок"
                              : "Сохранить видеоурок"
                          }
                        >
                          <Heart
                            className={`w-3.5 h-3.5 ${
                              isSaved ? "fill-current" : ""
                            }`}
                          />
                        </button>
                      </div>

                      {/* Bottom Overlay Meta */}
                      <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] text-white/95">
                        <span className="font-semibold truncate max-w-[70%]">
                          {lesson.category}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-950/80 font-mono text-[10px] tabular-nums">
                          {lesson.duration || "Видео"}
                        </span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-4 space-y-2">
                      {lesson.ageGroup && (
                        <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                          {lesson.ageGroup}
                        </div>
                      )}
                      <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-red-600 transition leading-snug line-clamp-2">
                        {lesson.title}
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                        {lesson.description}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-4 pb-4 pt-2.5 border-t border-slate-100 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono tabular-nums">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          <span>{lesson.viewsCount || 1}</span>
                        </span>
                        {isWatched && (
                          <>
                            <span>·</span>
                            <span className="text-emerald-600 font-sans font-bold flex items-center gap-0.5">
                              <Check className="w-3 h-3" />
                              <span>Изучено</span>
                            </span>
                          </>
                        )}
                      </div>

                      <span className="font-bold text-slate-900 group-hover:text-red-600 flex items-center gap-1 transition text-xs">
                        <Play className="w-3 h-3 fill-current" />
                        <span>{isPlaying ? "Воспроизводится" : "Смотреть"}</span>
                      </span>
                    </div>

                    {/* Admin / Director Quick Controls */}
                    {canManage && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5"
                      >
                        {confirmDeleteId === lesson.id ? (
                          <div className="flex items-center justify-between w-full bg-rose-50 px-2.5 py-1.5 rounded-xl border border-rose-200">
                            <span className="text-[11px] font-bold text-rose-800">
                              Удалить урок?
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  handleConfirmDelete(lesson.id, lesson.title)
                                }
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                              >
                                Да, удалить
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-1 bg-white text-slate-600 border border-slate-200 rounded-lg text-[10px] font-semibold cursor-pointer"
                              >
                                Отмена
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                updateVideoLesson(lesson.id, {
                                  isPinned: !lesson.isPinned,
                                })
                              }
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition flex items-center gap-1 cursor-pointer ${
                                lesson.isPinned
                                  ? "bg-amber-100 text-amber-900"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                            >
                              <Pin className="w-3 h-3" />
                              <span>
                                {lesson.isPinned ? "Закреплено" : "Закрепить"}
                              </span>
                            </button>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={(e) => openEditModal(lesson, e)}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition flex items-center gap-1 cursor-pointer"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>Изменить</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(lesson.id)}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                                title="Удалить видеоурок"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Modal for Adding / Editing Video Lesson (Director & Administrator) */}
      {isFormModalOpen && (
        <div
          onClick={() => setIsFormModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 shadow-2xl text-left"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white">
                  <Film className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base">
                    {editingLesson
                      ? "Редактировать видеоурок"
                      : "Разместить новый видеоурок в Базе знаний"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Урок сразу появится у всех родителей в режиме реального времени
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form
              onSubmit={handleSaveLesson}
              className="p-6 overflow-y-auto flex-1 space-y-4"
            >
              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                  {formError}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Название видеоурока <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Например: Техника ведения мяча и финт «Уход под себя»"
                  className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-900 rounded-xl text-xs sm:text-sm text-slate-900 outline-none transition font-medium"
                />
              </div>

              {/* Video Link + Upload */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    Ссылка на видео (YouTube, VK Видео, Rutube, Kinescope, MP4){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => videoFileInputRef.current?.click()}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Выбрать файл (.mp4)</span>
                  </button>
                  <input
                    ref={videoFileInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    onChange={handleVideoFileUpload}
                    className="hidden"
                  />
                </div>
                <input
                  type="text"
                  value={formVideoUrl}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormVideoUrl(val);
                    const parsed = parseVideoSource(val);
                    if (parsed.autoThumbnail) {
                      setFormThumbnailUrl(parsed.autoThumbnail);
                    }
                  }}
                  placeholder="Вставьте ссылку на YouTube, VK Видео, Rutube, Google Диск или прямой .mp4 файл..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-900 rounded-xl text-xs text-slate-900 outline-none transition font-mono"
                />

                {/* Live Video Preview inside Form */}
                {formVideoUrl.trim() && (
                  <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-950">
                    <div className="px-3 py-1.5 bg-slate-900 text-[11px] text-slate-300 flex items-center justify-between">
                      <span>
                        Предпросмотр плеера:{" "}
                        <strong className="text-emerald-400">
                          {parseVideoSource(formVideoUrl).providerLabel}
                        </strong>
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Готово к трансляции родителям
                      </span>
                    </div>
                    <div className="aspect-video max-h-48 w-full bg-black flex items-center justify-center">
                      {parseVideoSource(formVideoUrl).type === "html5" ? (
                        <video
                          src={parseVideoSource(formVideoUrl).src}
                          controls
                          playsInline
                          className="w-full h-full max-h-48 object-contain"
                        />
                      ) : (
                        <iframe
                          src={parseVideoSource(formVideoUrl).src}
                          title="Предпросмотр"
                          className="w-full h-full max-h-48 border-0"
                          allow="autoplay; encrypted-media; fullscreen"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Описание видеоурока и методика выполнения{" "}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Подробно опишите упражнение, количество повторений и ключевые цели урока для родителей и учеников..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-900 rounded-xl text-xs sm:text-sm text-slate-900 outline-none transition leading-relaxed"
                />
              </div>

              {/* Category, Age Group, Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Рубрика
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none"
                  >
                    {VIDEO_LESSON_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Возрастная группа
                  </label>
                  <select
                    value={formAgeGroup}
                    onChange={(e) => setFormAgeGroup(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none"
                  >
                    {VIDEO_LESSON_AGE_GROUPS.map((ag) => (
                      <option key={ag} value={ag}>
                        {ag}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Длительность
                  </label>
                  <input
                    type="text"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    placeholder="05:30"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 outline-none"
                  />
                </div>
              </div>

              {/* Coach Tips for Parents */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Совет тренера родителю (на что обратить внимание)
                </label>
                <textarea
                  rows={2}
                  value={formCoachTips}
                  onChange={(e) => setFormCoachTips(e.target.value)}
                  placeholder="Например: Следите, чтобы спина оставалась прямой, а касания мяча выполнялись мягко подушечкой стопы..."
                  className="w-full px-3.5 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-900 rounded-xl text-xs text-slate-900 outline-none transition"
                />
              </div>

              {/* Cover Image Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    Обложка видеоурока
                  </label>
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    className="text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Загрузить свою обложку</span>
                  </button>
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    className="hidden"
                  />
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {VIDEO_LESSON_COVER_PRESETS.map((preset, idx) => {
                    const isSelected = formThumbnailUrl === preset.url;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormThumbnailUrl(preset.url)}
                        className={`relative h-14 rounded-xl overflow-hidden border-2 transition cursor-pointer ${
                          isSelected
                            ? "border-red-600 ring-2 ring-red-600/20"
                            : "border-transparent opacity-75 hover:opacity-100"
                        }`}
                        title={preset.label}
                      >
                        <img
                          src={preset.url}
                          alt={preset.label}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pin Checkbox */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50/70 border border-amber-200/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formIsPinned}
                  onChange={(e) => setFormIsPinned(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500"
                />
                <div className="text-xs">
                  <div className="font-bold text-slate-900">
                    Закрепить видеоурок в начале списка («Рекомендуем»)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Закрепленные уроки отображаются первыми у всех родителей
                  </div>
                </div>
              </label>

              {/* Submit / Cancel Footer */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-extrabold uppercase tracking-wider transition cursor-pointer shadow-md shadow-red-600/20"
                >
                  {isSaving
                    ? "Сохранение..."
                    : editingLesson
                      ? "Сохранить изменения"
                      : "Опубликовать видеоурок"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
