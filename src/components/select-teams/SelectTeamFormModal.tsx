import React, { useState, useEffect } from "react";
import { X, Trophy, Calendar, MapPin, Banknote, Shield } from "lucide-react";
import { Coach, MatchFormat, TrainingGroup } from "../../types";
import {
  getFormationsForFormat,
  suggestMatchFormatByBirthYear,
} from "../../utils/selectTeamIntelligence";

interface SelectTeamFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  coaches: Coach[];
  editingTeam?: TrainingGroup | null;
  onSave: (data: {
    name: string;
    birthYearFrom: number;
    birthYearTo: number;
    coachId: string;
    coachName: string;
    assistantCoachId?: string;
    assistantCoachName?: string;
    targetCompetition: string;
    competitionDate?: string;
    competitionEndDate?: string;
    competitionLocation?: string;
    competitionFee: number;
    matchFormat: MatchFormat;
    formationId: string;
    selectTeamStatus: "forming" | "ready" | "completed";
    selectTeamNotes?: string;
  }) => Promise<void>;
}

const MATCH_FORMAT_OPTIONS: { value: MatchFormat; label: string }[] = [
  { value: "5x5", label: "5×5 (4+1)" },
  { value: "6x6", label: "6×6 (5+1)" },
  { value: "7x7", label: "7×7 (6+1)" },
  { value: "8x8", label: "8×8 (7+1)" },
  { value: "11x11", label: "11×11 (10+1)" },
];

export const SelectTeamFormModal: React.FC<SelectTeamFormModalProps> = ({
  isOpen,
  onClose,
  coaches,
  editingTeam,
  onSave,
}) => {
  const currentYear = new Date().getFullYear();
  const [name, setName] = useState("");
  const [birthYearFrom, setBirthYearFrom] = useState<number>(2018);
  const [birthYearTo, setBirthYearTo] = useState<number>(2018);
  const [coachId, setCoachId] = useState("");
  const [assistantCoachId, setAssistantCoachId] = useState("");
  const [targetCompetition, setTargetCompetition] = useState("");
  const [competitionDate, setCompetitionDate] = useState("");
  const [competitionEndDate, setCompetitionEndDate] = useState("");
  const [competitionLocation, setCompetitionLocation] = useState("");
  const [competitionFeeStr, setCompetitionFeeStr] = useState("1500");
  const [matchFormat, setMatchFormat] = useState<MatchFormat>("5x5");
  const [formationId, setFormationId] = useState("5x5_diamond");
  const [selectTeamStatus, setSelectTeamStatus] = useState<
    "forming" | "ready" | "completed"
  >("forming");
  const [selectTeamNotes, setSelectTeamNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    if (editingTeam) {
      setName(editingTeam.name || "");
      const yFrom = editingTeam.birthYearFrom || editingTeam.year || 2018;
      const yTo = editingTeam.birthYearTo || editingTeam.year || yFrom;
      setBirthYearFrom(yFrom);
      setBirthYearTo(yTo);
      setCoachId(editingTeam.coachId || "");
      setAssistantCoachId(editingTeam.assistantCoachId || "");
      setTargetCompetition(editingTeam.targetCompetition || "");
      setCompetitionDate(editingTeam.competitionDate || "");
      setCompetitionEndDate(editingTeam.competitionEndDate || "");
      setCompetitionLocation(editingTeam.competitionLocation || "");
      setCompetitionFeeStr(
        editingTeam.competitionFee !== undefined
          ? String(editingTeam.competitionFee)
          : "",
      );
      const suggested = suggestMatchFormatByBirthYear(yFrom);
      const fmt = editingTeam.matchFormat || suggested.format;
      setMatchFormat(fmt);
      setFormationId(editingTeam.formationId || suggested.formationId);
      setSelectTeamStatus(editingTeam.selectTeamStatus || "forming");
      setSelectTeamNotes(editingTeam.selectTeamNotes || "");
    } else {
      const defaultYear = 2018;
      const suggested = suggestMatchFormatByBirthYear(defaultYear);
      setName(`Сборная ${defaultYear}`);
      setBirthYearFrom(defaultYear);
      setBirthYearTo(defaultYear);
      setCoachId(coaches[0]?.id || "");
      setAssistantCoachId("");
      setTargetCompetition("");
      setCompetitionDate("");
      setCompetitionEndDate("");
      setCompetitionLocation("");
      setCompetitionFeeStr("1500");
      setMatchFormat(suggested.format);
      setFormationId(suggested.formationId);
      setSelectTeamStatus("forming");
      setSelectTeamNotes("");
    }
  }, [isOpen, editingTeam, coaches]);

  if (!isOpen) return null;

  const availableFormations = getFormationsForFormat(matchFormat);

  const handleBirthYearPreset = (year: number) => {
    setBirthYearFrom(year);
    setBirthYearTo(year);
    if (!editingTeam) {
      setName(`Сборная ${year}`);
    }
    const suggested = suggestMatchFormatByBirthYear(year);
    setMatchFormat(suggested.format);
    setFormationId(suggested.formationId);
  };

  const handleFormatChange = (fmt: MatchFormat) => {
    setMatchFormat(fmt);
    const formations = getFormationsForFormat(fmt);
    if (formations.length > 0) {
      setFormationId(formations[0].id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    const cleanName = name.trim();
    if (!cleanName) {
      setErrorMsg("Укажите название сборной команды.");
      return;
    }
    if (cleanName.length > 100) {
      setErrorMsg("Название сборной не должно превышать 100 символов.");
      return;
    }

    const headCoach = coaches.find((c) => c.id === coachId);
    const assistCoach = coaches.find((c) => c.id === assistantCoachId);
    const feeValue = Math.max(0, Number(competitionFeeStr.replace(/\s+/g, "")) || 0);

    setIsSaving(true);
    setErrorMsg(null);
    try {
      await onSave({
        name: cleanName,
        birthYearFrom: Math.min(birthYearFrom, birthYearTo),
        birthYearTo: Math.max(birthYearFrom, birthYearTo),
        coachId: coachId || "",
        coachName: headCoach?.name || "Не назначен",
        assistantCoachId: assistantCoachId || undefined,
        assistantCoachName: assistCoach?.name || undefined,
        targetCompetition: targetCompetition.trim(),
        competitionDate: competitionDate || undefined,
        competitionEndDate: competitionEndDate || undefined,
        competitionLocation: competitionLocation.trim() || undefined,
        competitionFee: feeValue,
        matchFormat,
        formationId,
        selectTeamStatus,
        selectTeamNotes: selectTeamNotes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || "Не удалось сохранить сборную команду.");
    } finally {
      setIsSaving(false);
    }
  };

  const quickYears = [2020, 2019, 2018, 2017, 2016, 2015, 2014];

  return (
    <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-red-600 shrink-0" />
            <div className="text-left">
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                {editingTeam ? "Редактировать сборную команду" : "Новая сборная команда"}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Параметры турнира, возрастной категории, формата игры и взноса
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 text-left">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-700">
              {errorMsg}
            </div>
          )}

          {/* Quick Year Selection */}
          {!editingTeam && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Быстрый выбор года рождения сборной
              </label>
              <div className="flex flex-wrap gap-1.5">
                {quickYears.map((yr) => {
                  const isActive = birthYearFrom === yr && birthYearTo === yr;
                  return (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => handleBirthYearPreset(yr)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold tabular-nums transition cursor-pointer border ${
                        isActive
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
                      }`}
                    >
                      {yr} г.р.
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Team Name & Years */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-6">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Название сборной *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                placeholder="Например: Сборная 2018"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                required
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Год рожд. от
              </label>
              <input
                type="number"
                min={2005}
                max={currentYear}
                value={birthYearFrom}
                onChange={(e) => setBirthYearFrom(Number(e.target.value) || 2018)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Год рожд. до
              </label>
              <input
                type="number"
                min={2005}
                max={currentYear}
                value={birthYearTo}
                onChange={(e) => setBirthYearTo(Number(e.target.value) || birthYearFrom)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
              />
            </div>
          </div>

          {/* Competition Details */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="text-xs font-semibold text-slate-900">
              Соревнование и организационный взнос
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Название турнира / соревнования
                </label>
                <input
                  type="text"
                  value={targetCompetition}
                  onChange={(e) => setTargetCompetition(e.target.value)}
                  placeholder="Например: Весенний кубок Перми"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Взнос на участие (₽ с игрока)
                </label>
                <div className="relative">
                  <Banknote className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="number"
                    min={0}
                    step={50}
                    value={competitionFeeStr}
                    onChange={(e) => setCompetitionFeeStr(e.target.value)}
                    placeholder="1500"
                    className="w-full pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">
                    ₽
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Дата начала
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="date"
                    value={competitionDate}
                    onChange={(e) => setCompetitionDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Дата окончания (если несколько дней)
                </label>
                <input
                  type="date"
                  value={competitionEndDate}
                  onChange={(e) => setCompetitionEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Место проведения / манеж
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={competitionLocation}
                    onChange={(e) => setCompetitionLocation(e.target.value)}
                    placeholder="Манеж Пермь Великая"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Format, Formation & Coaches */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-slate-500" />
              <span>Формат матча, тактическая схема и тренерский штаб</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Формат турнира
                </label>
                <select
                  value={matchFormat}
                  onChange={(e) => handleFormatChange(e.target.value as MatchFormat)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                >
                  {MATCH_FORMAT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Базовая схема
                </label>
                <select
                  value={formationId}
                  onChange={(e) => setFormationId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                >
                  {availableFormations.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Главный тренер сборной
                </label>
                <select
                  value={coachId}
                  onChange={(e) => setCoachId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                >
                  <option value="">Не назначен</option>
                  {coaches.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Помощник тренера
                </label>
                <select
                  value={assistantCoachId}
                  onChange={(e) => setAssistantCoachId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                >
                  <option value="">Без помощника</option>
                  {coaches
                    .filter((c) => c.id !== coachId)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Этап подготовки
                </label>
                <select
                  value={selectTeamStatus}
                  onChange={(e) =>
                    setSelectTeamStatus(
                      e.target.value as "forming" | "ready" | "completed",
                    )
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                >
                  <option value="forming">Идёт набор и сборы</option>
                  <option value="ready">Состав утверждён</option>
                  <option value="completed">Турнир завершён</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Организационные заметки (форма, время сбора, документы)
              </label>
              <textarea
                rows={2}
                value={selectTeamNotes}
                onChange={(e) => setSelectTeamNotes(e.target.value)}
                placeholder="Сбор за 40 минут до старта, красно-чёрная форма, оригинал свидетельства о рождении и медсправка."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 resize-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition cursor-pointer whitespace-nowrap"
            >
              {isSaving
                ? "Сохранение..."
                : editingTeam
                  ? "Сохранить изменения"
                  : "Создать сборную"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
