import React, { useState } from "react";
import { Sparkles, Award, TrendingUp, Calendar, ChevronRight, CheckCircle2, Target, Heart } from "lucide-react";
import { Client } from "../types";
import { useCRM } from "../context/CRMContext";
import { AIProgressReportModal } from "./AIProgressReportModal";

interface AIProgressReportCardProps {
  client: Client;
  canGenerate?: boolean;
}

export const AIProgressReportCard: React.FC<AIProgressReportCardProps> = ({
  client,
  canGenerate = true,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const reports = client.progressReports || [];
  const latestReport = reports[0] || null;

  return (
    <>
      <div className="bg-white rounded-2xl p-5 border border-gray-150 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Отчет ИИ о прогрессе (каждые 3 месяца)
              </h3>
              <p className="text-[11px] text-gray-400">
                Анализ отметок, посещаемости и комментариев тренеров
              </p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-red-50 text-red-600 border border-red-200">
            {reports.length > 0 ? `${reports.length} отчета` : "Требует формирования"}
          </span>
        </div>

        {latestReport ? (
          <div className="space-y-3">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-xs text-slate-900">
                    {latestReport.periodLabel}
                  </span>
                  <span className="text-[10px] bg-red-500 text-white font-bold font-mono px-1.5 py-0.2 rounded">
                    {latestReport.overallScore} / 5.0
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                  {latestReport.overallSummary}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-emerald-50/70 border border-emerald-200 p-2.5 rounded-xl">
                <div className="font-bold text-emerald-800 text-[11px] flex items-center space-x-1 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Главный прогресс:</span>
                </div>
                <div className="text-[11px] text-emerald-950 truncate">
                  {latestReport.strengths[0] || "Отличная динамика"}
                </div>
              </div>

              <div className="bg-amber-50/70 border border-amber-200 p-2.5 rounded-xl">
                <div className="font-bold text-amber-800 text-[11px] flex items-center space-x-1 mb-1">
                  <Target className="w-3.5 h-3.5" />
                  <span>Точка роста:</span>
                </div>
                <div className="text-[11px] text-amber-950 truncate">
                  {latestReport.growthAreas[0] || "Отработка слабой ноги"}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center space-x-2 shadow-xs cursor-pointer"
            >
              <span>Открыть полный 3-месячный отчет</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-3">
            <p className="text-xs text-slate-600">
              Искусственный интеллект формирует официальный сводный отчет о развитии ребенка за каждый 3-месячный квартал.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center space-x-2 mx-auto shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{canGenerate ? "Сформировать отчет за 3 месяца" : "Просмотреть отчет"}</span>
            </button>
          </div>
        )}
      </div>

      <AIProgressReportModal
        client={client}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        canGenerate={canGenerate}
      />
    </>
  );
};
