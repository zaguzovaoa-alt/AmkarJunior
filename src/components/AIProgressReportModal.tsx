import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  TrendingUp,
  Award,
  CheckCircle2,
  AlertCircle,
  Calendar,
  User,
  Shield,
  Printer,
  X,
  RefreshCw,
  Clock,
  Target,
  Heart,
  ChevronDown,
  Flame,
  Check,
  Star,
} from "lucide-react";
import { Client, AIProgressReport } from "../types";
import { useCRM } from "../context/CRMContext";

interface AIProgressReportModalProps {
  client: Client;
  isOpen: boolean;
  onClose: () => void;
  canGenerate?: boolean;
}

export const AIProgressReportModal: React.FC<AIProgressReportModalProps> = ({
  client,
  isOpen,
  onClose,
  canGenerate = true,
}) => {
  const { generateAIProgressReport, deleteAIProgressReport } = useCRM();
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customCoachNote, setCustomCoachNote] = useState("");
  const [selectedQuarter, setSelectedQuarter] = useState<number>(() => {
    return Math.ceil((new Date().getMonth() + 1) / 3);
  });
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    return new Date().getFullYear();
  });
  const [showGenerateForm, setShowGenerateForm] = useState(false);

  const reports = client.progressReports || [];
  const activeReport =
    reports.find((r) => r.id === selectedReportId) || reports[0] || null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const rep = await generateAIProgressReport(client.id, {
        quarterNumber: selectedQuarter,
        quarterYear: selectedYear,
        customCoachNote: customCoachNote.trim() || undefined,
      });
      if (rep) {
        setSelectedReportId(rep.id);
        setShowGenerateForm(false);
        setCustomCoachNote("");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        id="ai-progress-report-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] my-auto"
        >
          {/* Top Header */}
          <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-center justify-between relative border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center shadow-lg shadow-red-500/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                    ИИ-Отчет о прогрессе за 3 месяца
                  </h2>
                  <span className="bg-red-500/20 border border-red-500/30 text-red-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                    АМКАР ЮНИОР
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Спортсмен: <span className="text-white font-semibold">{client.childSurname} {client.childName}</span> ({client.childAge} лет, {client.groupName || "Основная группа"})
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {activeReport && (
                <button
                  onClick={handlePrint}
                  id="btn-print-ai-report"
                  className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
                  title="Распечатать или сохранить в PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Печать / PDF</span>
                </button>
              )}
              <button
                onClick={onClose}
                id="btn-close-ai-report-modal"
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation & Period Selector Bar */}
          <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2 overflow-x-auto py-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono whitespace-nowrap">
                Периоды:
              </span>
              {reports.length === 0 ? (
                <span className="text-xs text-slate-400 italic">
                  Отчетов за 3 месяца пока нет
                </span>
              ) : (
                reports.map((rep) => {
                  const isSelected = activeReport?.id === rep.id;
                  return (
                    <button
                      key={rep.id}
                      onClick={() => {
                        setSelectedReportId(rep.id);
                        setShowGenerateForm(false);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
                        isSelected
                          ? "bg-slate-900 text-white shadow-xs"
                          : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <Calendar className="w-3 h-3" />
                      <span>{rep.periodLabel}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                          isSelected
                            ? "bg-red-500 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {rep.overallScore}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {canGenerate && (
              <button
                onClick={() => setShowGenerateForm(!showGenerateForm)}
                id="btn-toggle-generate-report"
                className="ml-auto px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {showGenerateForm
                    ? "Скрыть форму"
                    : reports.length > 0
                    ? "Сформировать новый отчет"
                    : "Сформировать первый отчет"}
                </span>
              </button>
            )}
          </div>

          {/* Modal Body */}
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
            {/* Generation Form if open or if no reports exist */}
            {(showGenerateForm || reports.length === 0) && canGenerate && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50/70 border border-red-200 rounded-2xl p-5 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-red-600" />
                      <span>Генерация отчета ИИ за 3-месячный цикл</span>
                    </h3>
                    <p className="text-xs text-slate-600 mt-1">
                      Искусственный интеллект проанализирует динамику посещаемости, отметки тренера по технике и тактике, протоколы тренировок и сформирует полный аналитический срез.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Квартал / Трехмесячный период:
                    </label>
                    <select
                      value={selectedQuarter}
                      onChange={(e) => setSelectedQuarter(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-red-500"
                    >
                      <option value={1}>1 квартал (Январь — Март)</option>
                      <option value={2}>2 квартал (Апрель — Июнь)</option>
                      <option value={3}>3 квартал (Июль — Сентябрь)</option>
                      <option value={4}>4 квартал (Октябрь — Декабрь)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Год отчета:
                    </label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-red-500"
                    >
                      <option value={2026}>2026 год</option>
                      <option value={2025}>2025 год</option>
                      <option value={2024}>2024 год</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Дополнительный комментарий тренера к отчету (необязательно):
                  </label>
                  <textarea
                    rows={2}
                    value={customCoachNote}
                    onChange={(e) => setCustomCoachNote(e.target.value)}
                    placeholder="Например: Отличная работа в единоборствах, лидерские качества в последних играх..."
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-red-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-1">
                  {reports.length > 0 && (
                    <button
                      onClick={() => setShowGenerateForm(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                    >
                      Отмена
                    </button>
                  )}
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    id="btn-submit-generate-report"
                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center space-x-2 shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Формируем отчет с ИИ...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Сформировать отчет за 3 месяца</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Active Report Display */}
            {activeReport ? (
              <div id="printable-ai-report" className="space-y-6">
                {/* Score & Key Highlights Banner */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Rating Card */}
                  <div className="md:col-span-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 flex flex-col justify-between shadow-md">
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-300 border-b border-slate-700/80 pb-2">
                        <span className="font-semibold">{activeReport.periodLabel}</span>
                        <span className="font-mono text-[10px] text-red-400">3 МЕСЯЦА</span>
                      </div>
                      <div className="flex items-center justify-center my-4">
                        <div className="relative flex items-center justify-center w-28 h-28">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle
                              cx="56"
                              cy="56"
                              r="46"
                              stroke="#334155"
                              strokeWidth="8"
                              fill="transparent"
                            />
                            <circle
                              cx="56"
                              cy="56"
                              r="46"
                              stroke="#ef4444"
                              strokeWidth="8"
                              fill="transparent"
                              strokeDasharray={`${2 * Math.PI * 46}`}
                              strokeDashoffset={`${
                                2 * Math.PI * 46 * (1 - (activeReport.overallScore || 4.5) / 5)
                              }`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute flex flex-col items-center">
                            <span className="text-3xl font-black text-white font-sans">
                              {activeReport.overallScore}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              из 5.0
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-800/80 rounded-xl p-3 text-center border border-slate-700">
                      <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider font-bold">
                        Посещаемость за квартал
                      </div>
                      <div className="text-base font-black text-emerald-400 mt-0.5">
                        {activeReport.attendanceStats.attendanceRate}% ({activeReport.attendanceStats.present}/{activeReport.attendanceStats.totalSessions} зан.)
                      </div>
                    </div>
                  </div>

                  {/* Skills Grid */}
                  <div className="md:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                          Оценка спортивных навыков (по отметкам тренеров)
                        </h4>
                        <span className="text-[10px] font-bold text-slate-400">
                          {new Date(activeReport.createdAt).toLocaleDateString("ru-RU")}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[
                          {
                            name: "Техника",
                            score: activeReport.radarScores?.technique || activeReport.metrics.technique,
                            color: "bg-emerald-500",
                          },
                          {
                            name: "Тактика",
                            score: activeReport.radarScores?.tactics || activeReport.metrics.tactics,
                            color: "bg-indigo-500",
                          },
                          {
                            name: "Физподготовка",
                            score: activeReport.radarScores?.physical || activeReport.metrics.physical,
                            color: "bg-amber-500",
                          },
                          {
                            name: "Дисциплина",
                            score: activeReport.radarScores?.discipline || activeReport.metrics.discipline,
                            color: "bg-red-500",
                          },
                          {
                            name: "Скорость",
                            score: activeReport.radarScores?.speed || 4.5,
                            color: "bg-sky-500",
                          },
                          {
                            name: "Командность",
                            score: activeReport.radarScores?.teamwork || 4.7,
                            color: "bg-teal-500",
                          },
                        ].map((skill, idx) => (
                          <div key={idx} className="bg-slate-50 border border-slate-150 p-2.5 rounded-xl">
                            <div className="flex justify-between items-center text-xs mb-1.5">
                              <span className="font-semibold text-slate-700">{skill.name}</span>
                              <span className="font-black text-slate-900">{skill.score}</span>
                            </div>
                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`${skill.color} h-full rounded-full`}
                                style={{ width: `${(skill.score / 5) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {activeReport.coachNotesSummary && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-600 flex items-start space-x-1.5">
                        <span className="font-bold text-slate-700 whitespace-nowrap">Учтено в отчете:</span>
                        <span className="text-slate-500 truncate">{activeReport.coachNotesSummary}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Overall Summary by AI */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
                  <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
                    <Sparkles className="w-4 h-4 text-red-600" />
                    <span>Общий анализ прогресса за 3 месяца</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {activeReport.overallSummary}
                  </p>
                </div>

                {/* Strengths & Growth Areas 2-column */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Strengths */}
                  <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center space-x-2 text-emerald-900 font-bold text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Главные сильные стороны и прогресс</span>
                    </div>
                    <ul className="space-y-2">
                      {activeReport.strengths.map((st, idx) => (
                        <li key={idx} className="flex items-start space-x-2 text-xs text-emerald-950">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                          <span>{st}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Growth Areas */}
                  <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm">
                      <Target className="w-4 h-4 text-amber-600" />
                      <span>Зоны развития на следующий квартал</span>
                    </div>
                    <ul className="space-y-2">
                      {activeReport.growthAreas.map((ga, idx) => (
                        <li key={idx} className="flex items-start space-x-2 text-xs text-amber-950">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                          <span>{ga}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Recommendations for Child & Parents */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Child Exercises */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
                      <Flame className="w-4 h-4 text-red-600" />
                      <span>Рекомендации юному спортсмену</span>
                    </div>
                    <ul className="space-y-2">
                      {activeReport.recommendationsForChild.map((rc, idx) => (
                        <li key={idx} className="flex items-start space-x-2 text-xs text-slate-700">
                          <span className="font-bold text-red-600 mr-1 font-mono">{idx + 1}.</span>
                          <span>{rc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Parent Guidance */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
                      <Heart className="w-4 h-4 text-rose-600" />
                      <span>Советы и поддержка для родителей</span>
                    </div>
                    <ul className="space-y-2">
                      {activeReport.recommendationsForParents.map((rp, idx) => (
                        <li key={idx} className="flex items-start space-x-2 text-xs text-slate-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                          <span>{rp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Coach Message & Motivational Quote */}
                <div className="bg-gradient-to-r from-red-600 to-amber-600 text-white rounded-2xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-white/20 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider font-mono text-red-100">
                      Напутствие тренерского штаба «АМКАР ЮНИОР»
                    </span>
                    <Award className="w-4 h-4 text-amber-200" />
                  </div>
                  <p className="text-xs sm:text-sm font-medium leading-relaxed text-white">
                    "{activeReport.coachTips}"
                  </p>
                  <div className="text-[11px] text-amber-100 italic pt-1">
                    {activeReport.motivationalMessage}
                  </div>
                </div>

                {/* Delete button for coaches / admins */}
                {canGenerate && (
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => {
                        if (confirm("Вы уверены, что хотите удалить этот отчет за 3 месяца?")) {
                          deleteAIProgressReport(client.id, activeReport.id);
                        }
                      }}
                      className="text-xs text-red-500 hover:text-red-700 font-medium transition cursor-pointer"
                    >
                      Удалить данный отчет
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 space-y-3">
                <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  Пока нет сформированных отчетов за 3 месяца
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Нажмите кнопку «Сформировать отчет за 3 месяца», чтобы искусственный интеллект проанализировал тренировки и отметки ребенка.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
