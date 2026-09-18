import React, { useState, useEffect } from "react";
import {
  Bookmark,
  Check,
  Plus,
  Trash2,
  FolderPlus,
  Trophy,
  Sparkles,
} from "lucide-react";
import {
  GroupTemplate,
  loadSavedGroupTemplates,
  saveCustomGroupTemplate,
  deleteCustomGroupTemplate,
} from "./groupTemplates";

interface GroupTemplateSelectorProps {
  currentName: string;
  birthYearFrom: number | string;
  birthYearTo: number | string;
  isSelectTeam: boolean;
  targetCompetition?: string;
  onSelectTemplate: (template: {
    name: string;
    birthYearFrom: number;
    birthYearTo: number;
    isSelectTeam?: boolean;
    targetCompetition?: string;
    suggestedCapacity?: number;
  }) => void;
}

export const GroupTemplateSelector: React.FC<GroupTemplateSelectorProps> = ({
  currentName,
  birthYearFrom,
  birthYearTo,
  isSelectTeam,
  targetCompetition,
  onSelectTemplate,
}) => {
  const [templates, setTemplates] = useState<GroupTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setTemplates(loadSavedGroupTemplates());
  }, []);

  const handleSelect = (tmplId: string) => {
    setSelectedTemplateId(tmplId);
    if (!tmplId) return;

    const matched = templates.find((t) => t.id === tmplId);
    if (matched) {
      onSelectTemplate({
        name: matched.name,
        birthYearFrom: matched.birthYearFrom,
        birthYearTo: matched.birthYearTo,
        isSelectTeam: matched.isSelectTeam,
        targetCompetition: matched.targetCompetition,
        suggestedCapacity: matched.suggestedCapacity,
      });
    }
  };

  const handleSaveCurrentAsTemplate = () => {
    if (!currentName.trim()) {
      alert("Сначала укажите название группы для сохранения!");
      return;
    }
    const fromYear =
      typeof birthYearFrom === "number"
        ? birthYearFrom
        : parseInt(birthYearFrom as string, 10) || new Date().getFullYear() - 8;
    const toYear =
      typeof birthYearTo === "number"
        ? birthYearTo
        : parseInt(birthYearTo as string, 10) || new Date().getFullYear() - 6;

    const updated = saveCustomGroupTemplate({
      name: currentName.trim(),
      birthYearFrom: fromYear,
      birthYearTo: toYear,
      isSelectTeam,
      targetCompetition,
    });
    setTemplates(updated);
    setSaveSuccessMsg("Группа сохранена в список шаблонов!");
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleDeleteTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deleteCustomGroupTemplate(id);
    setTemplates(updated);
    if (selectedTemplateId === id) {
      setSelectedTemplateId("");
    }
  };

  const defaultTemplates = templates.filter((t) => !t.isCustom);
  const customTemplates = templates.filter((t) => t.isCustom);

  return (
    <div className="space-y-2 bg-slate-50/80 p-3 rounded-2xl border border-slate-200">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-black text-slate-900 uppercase font-mono tracking-wider flex items-center gap-1.5">
          <FolderPlus className="w-3.5 h-3.5 text-red-600" />
          <span>Выбрать группу из списка шаблонов</span>
        </label>
        {currentName.trim() && (
          <button
            type="button"
            onClick={handleSaveCurrentAsTemplate}
            className="text-[10px] text-red-600 hover:text-red-700 font-bold flex items-center gap-1 transition cursor-pointer"
            title="Сохранить текущую группу в шаблоны"
          >
            <Bookmark className="w-3 h-3" /> Сохранить в список
          </button>
        )}
      </div>

      {/* Dropdown Selector */}
      <div className="flex items-center gap-2">
        <select
          value={selectedTemplateId}
          onChange={(e) => handleSelect(e.target.value)}
          className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:border-red-500"
        >
          <option value="">-- Выберите типовую группу из списка --</option>
          {customTemplates.length > 0 && (
            <optgroup label="⭐ Мои сохраненные группы">
              {customTemplates.map((tmpl) => (
                <option key={tmpl.id} value={tmpl.id}>
                  {tmpl.name} ({tmpl.birthYearFrom}–{tmpl.birthYearTo} г.р.)
                </option>
              ))}
            </optgroup>
          )}
          <optgroup label="⚽ Стандартные возрастные группы">
            {defaultTemplates.map((tmpl) => (
              <option key={tmpl.id} value={tmpl.id}>
                {tmpl.name}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      {/* Quick Chips for Most Common Groups */}
      <div className="flex flex-wrap gap-1.5 pt-0.5">
        {templates.slice(0, 6).map((tmpl) => {
          const isSelected = currentName.trim() === tmpl.name.trim();
          return (
            <button
              type="button"
              key={tmpl.id}
              onClick={() => handleSelect(tmpl.id)}
              className={`text-[10px] px-2 py-0.5 rounded-lg border font-medium transition cursor-pointer flex items-center gap-1 ${
                isSelected
                  ? "bg-red-600 text-white border-red-600 font-bold"
                  : "bg-white text-slate-700 border-slate-200 hover:border-red-200 hover:bg-red-50/40"
              }`}
            >
              {tmpl.isSelectTeam && <Trophy className="w-2.5 h-2.5 text-amber-500" />}
              <span>{tmpl.name.replace(/\(.*?\)/g, "").trim()}</span>
              {tmpl.isCustom && (
                <span
                  onClick={(e) => handleDeleteTemplate(tmpl.id, e)}
                  className="hover:text-red-400 p-0.5"
                  title="Удалить"
                >
                  ✕
                </span>
              )}
            </button>
          );
        })}
      </div>

      {saveSuccessMsg && (
        <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
          <Check className="w-3 h-3 text-emerald-600" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}
    </div>
  );
};
