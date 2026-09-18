export interface GroupTemplate {
  id: string;
  name: string;
  category?: string;
  birthYearFrom: number;
  birthYearTo: number;
  isSelectTeam?: boolean;
  targetCompetition?: string;
  suggestedCapacity?: number;
  isCustom?: boolean;
}

export const DEFAULT_GROUP_TEMPLATES: GroupTemplate[] = [
  {
    id: "gt_2014_2015",
    name: "Группа 2014-2015 (Старшая)",
    category: "Старшие",
    birthYearFrom: 2014,
    birthYearTo: 2015,
    suggestedCapacity: 16,
  },
  {
    id: "gt_2016_2017",
    name: "Группа 2016-2017 (Средняя)",
    category: "Средние",
    birthYearFrom: 2016,
    birthYearTo: 2017,
    suggestedCapacity: 15,
  },
  {
    id: "gt_2018_2019",
    name: "Группа 2018-2019 (Младшая)",
    category: "Младшие",
    birthYearFrom: 2018,
    birthYearTo: 2019,
    suggestedCapacity: 14,
  },
  {
    id: "gt_2020_2021",
    name: "Группа 2020-2021 (Начальная)",
    category: "Начальные",
    birthYearFrom: 2020,
    birthYearTo: 2021,
    suggestedCapacity: 12,
  },
  {
    id: "gt_younger",
    name: "Младшая группа (4–6 лет)",
    category: "Возрастные",
    birthYearFrom: 2020,
    birthYearTo: 2022,
    suggestedCapacity: 12,
  },
  {
    id: "gt_middle",
    name: "Средняя группа (7–9 лет)",
    category: "Возрастные",
    birthYearFrom: 2017,
    birthYearTo: 2019,
    suggestedCapacity: 15,
  },
  {
    id: "gt_senior",
    name: "Старшая группа (10–13 лет)",
    category: "Возрастные",
    birthYearFrom: 2013,
    birthYearTo: 2016,
    suggestedCapacity: 18,
  },
  {
    id: "gt_select_14_15",
    name: "Сборная команда 2014-2015",
    category: "Сборные",
    birthYearFrom: 2014,
    birthYearTo: 2015,
    isSelectTeam: true,
    targetCompetition: "Первенство города",
    suggestedCapacity: 16,
  },
  {
    id: "gt_select_16_17",
    name: "Сборная команда 2016-2017",
    category: "Сборные",
    birthYearFrom: 2016,
    birthYearTo: 2017,
    isSelectTeam: true,
    targetCompetition: "Кубок Чемпионов",
    suggestedCapacity: 15,
  },
  {
    id: "gt_individual",
    name: "Индивидуальная / Доп. группа",
    category: "Спецгруппы",
    birthYearFrom: 2012,
    birthYearTo: 2021,
    suggestedCapacity: 6,
  },
];

const STORAGE_KEY_GROUP_TEMPLATES = "amkar_saved_group_templates";

export function loadSavedGroupTemplates(): GroupTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GROUP_TEMPLATES);
    if (!raw) return DEFAULT_GROUP_TEMPLATES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Merge defaults with custom, keeping custom ones
      const customOnes = parsed.filter((p: GroupTemplate) => p.isCustom);
      return [...DEFAULT_GROUP_TEMPLATES, ...customOnes];
    }
    return DEFAULT_GROUP_TEMPLATES;
  } catch (e) {
    console.error("Failed to load group templates:", e);
    return DEFAULT_GROUP_TEMPLATES;
  }
}

export function saveCustomGroupTemplate(template: {
  name: string;
  birthYearFrom: number;
  birthYearTo: number;
  isSelectTeam?: boolean;
  targetCompetition?: string;
  suggestedCapacity?: number;
}): GroupTemplate[] {
  try {
    const current = loadSavedGroupTemplates();
    const cleanName = template.name.trim();
    if (!cleanName) return current;

    // Check if duplicate exists
    const existingIndex = current.findIndex(
      (t) => t.name.toLowerCase() === cleanName.toLowerCase()
    );

    const newTemplate: GroupTemplate = {
      id: `gt_custom_${Date.now()}`,
      name: cleanName,
      category: template.isSelectTeam ? "Сборные" : "Мои шаблоны",
      birthYearFrom: template.birthYearFrom,
      birthYearTo: template.birthYearTo,
      isSelectTeam: template.isSelectTeam,
      targetCompetition: template.targetCompetition,
      suggestedCapacity: template.suggestedCapacity,
      isCustom: true,
    };

    let updated: GroupTemplate[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = { ...newTemplate, id: current[existingIndex].id };
    } else {
      updated = [...current, newTemplate];
    }

    const customOnly = updated.filter((t) => t.isCustom);
    localStorage.setItem(STORAGE_KEY_GROUP_TEMPLATES, JSON.stringify(customOnly));
    return updated;
  } catch (e) {
    console.error("Failed to save group template:", e);
    return DEFAULT_GROUP_TEMPLATES;
  }
}

export function deleteCustomGroupTemplate(id: string): GroupTemplate[] {
  try {
    const current = loadSavedGroupTemplates();
    const updated = current.filter((t) => t.id !== id);
    const customOnly = updated.filter((t) => t.isCustom);
    localStorage.setItem(STORAGE_KEY_GROUP_TEMPLATES, JSON.stringify(customOnly));
    return updated;
  } catch (e) {
    console.error("Failed to delete group template:", e);
    return DEFAULT_GROUP_TEMPLATES;
  }
}

// ---------------- SCHEDULE TEMPLATES ----------------

export interface ScheduleTemplate {
  id: string;
  label: string;
  rawSchedule: string;
  isCustom?: boolean;
}

export const DEFAULT_SCHEDULE_TEMPLATES: ScheduleTemplate[] = [
  {
    id: "st_mon_wed_18",
    label: "Пн, Ср 18:00-19:00",
    rawSchedule: "Пн 18:00 - 19:00, Ср 18:00 - 19:00",
  },
  {
    id: "st_tue_thu_18",
    label: "Вт, Чт 18:00-19:00",
    rawSchedule: "Вт 18:00 - 19:00, Чт 18:00 - 19:00",
  },
  {
    id: "st_tue_thu_19",
    label: "Вт, Чт 19:00-20:00",
    rawSchedule: "Вт 19:00 - 20:00, Чт 19:00 - 20:00",
  },
  {
    id: "st_mon_wed_fri_18",
    label: "Пн, Ср, Пт 18:00-19:00",
    rawSchedule: "Пн 18:00 - 19:00, Ср 18:00 - 19:00, Пт 18:00 - 19:00",
  },
  {
    id: "st_mon_wed_fri_19",
    label: "Пн, Ср, Пт 19:00-20:00",
    rawSchedule: "Пн 19:00 - 20:00, Ср 19:00 - 20:00, Пт 19:00 - 20:00",
  },
  {
    id: "st_sat_sun_10",
    label: "Сб, Вс 10:00-11:30 (Выходные)",
    rawSchedule: "Сб 10:00 - 11:30, Вс 10:00 - 11:30",
  },
  {
    id: "st_sat_sun_1130",
    label: "Сб, Вс 11:30-13:00 (Выходные)",
    rawSchedule: "Сб 11:30 - 13:00, Вс 11:30 - 13:00",
  },
];

const STORAGE_KEY_SCHEDULE_TEMPLATES = "amkar_saved_schedule_templates";

export function loadSavedScheduleTemplates(): ScheduleTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SCHEDULE_TEMPLATES);
    if (!raw) return DEFAULT_SCHEDULE_TEMPLATES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const customOnes = parsed.filter((p: ScheduleTemplate) => p.isCustom);
      return [...DEFAULT_SCHEDULE_TEMPLATES, ...customOnes];
    }
    return DEFAULT_SCHEDULE_TEMPLATES;
  } catch (e) {
    console.error("Failed to load schedule templates:", e);
    return DEFAULT_SCHEDULE_TEMPLATES;
  }
}

export function saveCustomScheduleTemplate(rawSchedule: string, customLabel?: string): ScheduleTemplate[] {
  try {
    const current = loadSavedScheduleTemplates();
    const cleanSchedule = rawSchedule.trim();
    if (!cleanSchedule) return current;

    const label = customLabel?.trim() || cleanSchedule;
    const existingIndex = current.findIndex(
      (s) => s.rawSchedule.toLowerCase() === cleanSchedule.toLowerCase()
    );

    const newTemplate: ScheduleTemplate = {
      id: `st_custom_${Date.now()}`,
      label,
      rawSchedule: cleanSchedule,
      isCustom: true,
    };

    let updated: ScheduleTemplate[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = { ...newTemplate, id: current[existingIndex].id };
    } else {
      updated = [...current, newTemplate];
    }

    const customOnly = updated.filter((s) => s.isCustom);
    localStorage.setItem(STORAGE_KEY_SCHEDULE_TEMPLATES, JSON.stringify(customOnly));
    return updated;
  } catch (e) {
    console.error("Failed to save schedule template:", e);
    return DEFAULT_SCHEDULE_TEMPLATES;
  }
}

export function deleteCustomScheduleTemplate(id: string): ScheduleTemplate[] {
  try {
    const current = loadSavedScheduleTemplates();
    const updated = current.filter((s) => s.id !== id);
    const customOnly = updated.filter((s) => s.isCustom);
    localStorage.setItem(STORAGE_KEY_SCHEDULE_TEMPLATES, JSON.stringify(customOnly));
    return updated;
  } catch (e) {
    console.error("Failed to delete schedule template:", e);
    return DEFAULT_SCHEDULE_TEMPLATES;
  }
}
