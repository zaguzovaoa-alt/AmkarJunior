import {
  Client,
  Counterparty,
  MatchFormat,
  MatchOutcome,
  PlayerPosition,
  SelectTeamMatch,
  SelectTeamMember,
  SelectTeamParticipationStatus,
  SelectTeamPaymentStatus,
  TrainingGroup,
  TrainingSessionProtocol,
} from "../types";
import { formatGroupNameDisplay } from "./formatters";

export interface PositionMeta {
  code: PlayerPosition;
  shortLabel: string;
  label: string;
  pluralLabel: string;
  subRoles: string[];
  accentText: string;
  accentBg: string;
  accentBorder: string;
  pitchColor: string;
}

export const POSITION_META: Record<PlayerPosition, PositionMeta> = {
  GK: {
    code: "GK",
    shortLabel: "ВР",
    label: "Вратарь",
    pluralLabel: "Вратари",
    subRoles: ["Основной вратарь", "Вратарь-гоняла"],
    accentText: "text-amber-800",
    accentBg: "bg-amber-50",
    accentBorder: "border-amber-200",
    pitchColor: "#d97706",
  },
  DEF: {
    code: "DEF",
    shortLabel: "ЗЩ",
    label: "Защитник",
    pluralLabel: "Защитники",
    subRoles: [
      "Центральный защитник",
      "Левый защитник",
      "Правый защитник",
      "Последний защитник",
    ],
    accentText: "text-blue-800",
    accentBg: "bg-blue-50",
    accentBorder: "border-blue-200",
    pitchColor: "#2563eb",
  },
  MID: {
    code: "MID",
    shortLabel: "ПЗ",
    label: "Полузащитник",
    pluralLabel: "Полузащитники",
    subRoles: [
      "Центральный полузащитник",
      "Опорный полузащитник",
      "Плеймейкер / Атакующий",
      "Левый вингер",
      "Правый вингер",
    ],
    accentText: "text-emerald-800",
    accentBg: "bg-emerald-50",
    accentBorder: "border-emerald-200",
    pitchColor: "#059669",
  },
  FWD: {
    code: "FWD",
    shortLabel: "НП",
    label: "Нападающий",
    pluralLabel: "Нападающие",
    subRoles: ["Центрфорвард", "Крайний нападающий", "Оттянутый форвард"],
    accentText: "text-red-800",
    accentBg: "bg-red-50",
    accentBorder: "border-red-200",
    pitchColor: "#dc2626",
  },
  UNI: {
    code: "UNI",
    shortLabel: "УН",
    label: "Универсал",
    pluralLabel: "Универсалы",
    subRoles: [
      "Универсал (защита / центр)",
      "Универсал (центр / атака)",
      "Джокер со скамейки",
    ],
    accentText: "text-slate-700",
    accentBg: "bg-slate-100",
    accentBorder: "border-slate-300",
    pitchColor: "#475569",
  },
};

export const PARTICIPATION_META: Record<
  SelectTeamParticipationStatus,
  { label: string; shortLabel: string; textClass: string; activeBg: string }
> = {
  confirmed: {
    label: "Участвует",
    shortLabel: "Да",
    textClass: "text-emerald-700",
    activeBg: "bg-emerald-600 text-white",
  },
  pending: {
    label: "Ждём ответа",
    shortLabel: "Ждём",
    textClass: "text-amber-700",
    activeBg: "bg-amber-500 text-white",
  },
  reserve: {
    label: "Резерв",
    shortLabel: "Резерв",
    textClass: "text-blue-700",
    activeBg: "bg-blue-600 text-white",
  },
  declined: {
    label: "Не сможет",
    shortLabel: "Нет",
    textClass: "text-red-700",
    activeBg: "bg-red-600 text-white",
  },
};

export const PAYMENT_META: Record<
  SelectTeamPaymentStatus,
  { label: string; shortLabel: string; textClass: string; activeBg: string }
> = {
  paid: {
    label: "Сдал",
    shortLabel: "Сдал",
    textClass: "text-emerald-700",
    activeBg: "bg-emerald-600 text-white",
  },
  partial: {
    label: "Частично",
    shortLabel: "Часть",
    textClass: "text-amber-700",
    activeBg: "bg-amber-500 text-white",
  },
  unpaid: {
    label: "Не сдал",
    shortLabel: "Не сдал",
    textClass: "text-red-700",
    activeBg: "bg-red-600 text-white",
  },
  exempt: {
    label: "Льгота / 0 ₽",
    shortLabel: "Льгота",
    textClass: "text-slate-600",
    activeBg: "bg-slate-700 text-white",
  },
};

export interface FormationSlot {
  id: string;
  position: Exclude<PlayerPosition, "UNI">;
  label: string;
  subRole: string;
  side?: "left" | "center" | "right";
  x: number; // 0..100 (left -> right)
  y: number; // 0..100 (top attacking -> bottom own goal)
}

export interface TacticalFormation {
  id: string;
  format: MatchFormat;
  name: string;
  code: string;
  description: string;
  startersCount: number;
  slots: FormationSlot[];
}

export const MATCH_FORMATIONS: TacticalFormation[] = [
  // 5x5 (e.g. 2018-2020)
  {
    id: "5x5_diamond",
    format: "5x5",
    name: "1-2-1-1 «Ромб»",
    code: "1-2-1-1",
    description: "Сбалансированная детская схема: надёжный тыл, центр и острие.",
    startersCount: 5,
    slots: [
      { id: "gk", position: "GK", label: "ВР", subRole: "Основной вратарь", side: "center", x: 50, y: 88 },
      { id: "ld", position: "DEF", label: "ЛЗ", subRole: "Левый защитник", side: "left", x: 28, y: 67 },
      { id: "rd", position: "DEF", label: "ПЗЩ", subRole: "Правый защитник", side: "right", x: 72, y: 67 },
      { id: "cm", position: "MID", label: "ЦП", subRole: "Центральный полузащитник", side: "center", x: 50, y: 45 },
      { id: "st", position: "FWD", label: "НП", subRole: "Центрфорвард", side: "center", x: 50, y: 20 },
    ],
  },
  {
    id: "5x5_square",
    format: "5x5",
    name: "1-2-2 «Квадрат»",
    code: "1-2-2",
    description: "Два защитника и два активных форварда для мини-футбола.",
    startersCount: 5,
    slots: [
      { id: "gk", position: "GK", label: "ВР", subRole: "Основной вратарь", side: "center", x: 50, y: 88 },
      { id: "ld", position: "DEF", label: "ЛЗ", subRole: "Левый защитник", side: "left", x: 30, y: 65 },
      { id: "rd", position: "DEF", label: "ПЗЩ", subRole: "Правый защитник", side: "right", x: 70, y: 65 },
      { id: "lf", position: "FWD", label: "ЛН", subRole: "Крайний нападающий", side: "left", x: 30, y: 26 },
      { id: "rf", position: "FWD", label: "ПН", subRole: "Центрфорвард", side: "right", x: 70, y: 26 },
    ],
  },
  {
    id: "5x5_wings",
    format: "5x5",
    name: "1-1-2-1 «Фланги»",
    code: "1-1-2-1",
    description: "Один последний защитник, два быстрых фланга и нападающий.",
    startersCount: 5,
    slots: [
      { id: "gk", position: "GK", label: "ВР", subRole: "Основной вратарь", side: "center", x: 50, y: 88 },
      { id: "cd", position: "DEF", label: "ЦЗ", subRole: "Последний защитник", side: "center", x: 50, y: 68 },
      { id: "lm", position: "MID", label: "ЛП", subRole: "Левый вингер", side: "left", x: 24, y: 46 },
      { id: "rm", position: "MID", label: "ПП", subRole: "Правый вингер", side: "right", x: 76, y: 46 },
      { id: "st", position: "FWD", label: "НП", subRole: "Центрфорвард", side: "center", x: 50, y: 20 },
    ],
  },

  // 6x6 (e.g. 2016-2018)
  {
    id: "6x6_classic",
    format: "6x6",
    name: "1-2-2-1 «Классика»",
    code: "1-2-2-1",
    description: "Стандартный баланс линий для формата 6×6.",
    startersCount: 6,
    slots: [
      { id: "gk", position: "GK", label: "ВР", subRole: "Основной вратарь", side: "center", x: 50, y: 88 },
      { id: "ld", position: "DEF", label: "ЛЗ", subRole: "Левый защитник", side: "left", x: 30, y: 68 },
      { id: "rd", position: "DEF", label: "ПЗЩ", subRole: "Правый защитник", side: "right", x: 70, y: 68 },
      { id: "lm", position: "MID", label: "ЛП", subRole: "Левый вингер", side: "left", x: 26, y: 45 },
      { id: "rm", position: "MID", label: "ПП", subRole: "Правый вингер", side: "right", x: 74, y: 45 },
      { id: "st", position: "FWD", label: "НП", subRole: "Центрфорвард", side: "center", x: 50, y: 20 },
    ],
  },
  {
    id: "6x6_two_st",
    format: "6x6",
    name: "1-2-1-2 «Два форварда»",
    code: "1-2-1-2",
    description: "Активный прессинг парой нападающих при поддержке плеймейкера.",
    startersCount: 6,
    slots: [
      { id: "gk", position: "GK", label: "ВР", subRole: "Основной вратарь", side: "center", x: 50, y: 88 },
      { id: "ld", position: "DEF", label: "ЛЗ", subRole: "Левый защитник", side: "left", x: 30, y: 68 },
      { id: "rd", position: "DEF", label: "ПЗЩ", subRole: "Правый защитник", side: "right", x: 70, y: 68 },
      { id: "cm", position: "MID", label: "ЦП", subRole: "Плеймейкер / Атакующий", side: "center", x: 50, y: 47 },
      { id: "lf", position: "FWD", label: "ЛН", subRole: "Крайний нападающий", side: "left", x: 32, y: 22 },
      { id: "rf", position: "FWD", label: "ПН", subRole: "Центрфорвард", side: "right", x: 68, y: 22 },
    ],
  },

  // 7x7 (e.g. 2015-2017)
  {
    id: "7x7_classic",
    format: "7x7",
    name: "1-2-3-1 «Баланс»",
    code: "1-2-3-1",
    description: "Контроль центра и ширины поля через тройку полузащитников.",
    startersCount: 7,
    slots: [
      { id: "gk", position: "GK", label: "ВР", subRole: "Основной вратарь", side: "center", x: 50, y: 89 },
      { id: "ld", position: "DEF", label: "ЛЗ", subRole: "Левый защитник", side: "left", x: 32, y: 70 },
      { id: "rd", position: "DEF", label: "ПЗЩ", subRole: "Правый защитник", side: "right", x: 68, y: 70 },
      { id: "lm", position: "MID", label: "ЛП", subRole: "Левый вингер", side: "left", x: 20, y: 46 },
      { id: "cm", position: "MID", label: "ЦП", subRole: "Центральный полузащитник", side: "center", x: 50, y: 48 },
      { id: "rm", position: "MID", label: "ПП", subRole: "Правый вингер", side: "right", x: 80, y: 46 },
      { id: "st", position: "FWD", label: "НП", subRole: "Центрфорвард", side: "center", x: 50, y: 20 },
    ],
  },
  {
    id: "7x7_def",
    format: "7x7",
    name: "1-3-2-1 «Надёжная»",
    code: "1-3-2-1",
    description: "Усиленная линия обороны с тремя защитниками.",
    startersCount: 7,
    slots: [
      { id: "gk", position: "GK", label: "ВР", subRole: "Основной вратарь", side: "center", x: 50, y: 89 },
      { id: "ld", position: "DEF", label: "ЛЗ", subRole: "Левый защитник", side: "left", x: 22, y: 69 },
      { id: "cd", position: "DEF", label: "ЦЗ", subRole: "Центральный защитник", side: "center", x: 50, y: 72 },
      { id: "rd", position: "DEF", label: "ПЗЩ", subRole: "Правый защитник", side: "right", x: 78, y: 69 },
      { id: "lm", position: "MID", label: "ЦПЛ", subRole: "Центральный полузащитник", side: "left", x: 33, y: 45 },
      { id: "rm", position: "MID", label: "ЦПП", subRole: "Плеймейкер / Атакующий", side: "right", x: 67, y: 45 },
      { id: "st", position: "FWD", label: "НП", subRole: "Центрфорвард", side: "center", x: 50, y: 20 },
    ],
  },

  // 8x8 (e.g. 2013-2015)
  {
    id: "8x8_classic",
    format: "8x8",
    name: "1-3-3-1 «Стандарт»",
    code: "1-3-3-1",
    description: "Классическая схема юношеских первенств 8×8.",
    startersCount: 8,
    slots: [
      { id: "gk", position: "GK", label: "ВР", subRole: "Основной вратарь", side: "center", x: 50, y: 90 },
      { id: "ld", position: "DEF", label: "ЛЗ", subRole: "Левый защитник", side: "left", x: 22, y: 71 },
      { id: "cd", position: "DEF", label: "ЦЗ", subRole: "Центральный защитник", side: "center", x: 50, y: 73 },
      { id: "rd", position: "DEF", label: "ПЗЩ", subRole: "Правый защитник", side: "right", x: 78, y: 71 },
      { id: "lm", position: "MID", label: "ЛП", subRole: "Левый вингер", side: "left", x: 22, y: 46 },
      { id: "cm", position: "MID", label: "ЦП", subRole: "Центральный полузащитник", side: "center", x: 50, y: 49 },
      { id: "rm", position: "MID", label: "ПП", subRole: "Правый вингер", side: "right", x: 78, y: 46 },
      { id: "st", position: "FWD", label: "НП", subRole: "Центрфорвард", side: "center", x: 50, y: 20 },
    ],
  },
  {
    id: "8x8_attack",
    format: "8x8",
    name: "1-2-3-2 «Атака»",
    code: "1-2-3-2",
    description: "Два нападающих для активной игры первым номером.",
    startersCount: 8,
    slots: [
      { id: "gk", position: "GK", label: "ВР", subRole: "Основной вратарь", side: "center", x: 50, y: 90 },
      { id: "ld", position: "DEF", label: "ЛЗ", subRole: "Левый защитник", side: "left", x: 32, y: 72 },
      { id: "rd", position: "DEF", label: "ПЗЩ", subRole: "Правый защитник", side: "right", x: 68, y: 72 },
      { id: "lm", position: "MID", label: "ЛП", subRole: "Левый вингер", side: "left", x: 20, y: 47 },
      { id: "cm", position: "MID", label: "ЦП", subRole: "Опорный полузащитник", side: "center", x: 50, y: 50 },
      { id: "rm", position: "MID", label: "ПП", subRole: "Правый вингер", side: "right", x: 80, y: 47 },
      { id: "lf", position: "FWD", label: "ЛН", subRole: "Крайний нападающий", side: "left", x: 33, y: 21 },
      { id: "rf", position: "FWD", label: "ПН", subRole: "Центрфорвард", side: "right", x: 67, y: 21 },
    ],
  },

  // 11x11
  {
    id: "11x11_433",
    format: "11x11",
    name: "1-4-3-3 «Большое поле»",
    code: "1-4-3-3",
    description: "Современная схема большого футбола с тройкой атаки.",
    startersCount: 11,
    slots: [
      { id: "gk", position: "GK", label: "ВР", subRole: "Основной вратарь", side: "center", x: 50, y: 91 },
      { id: "lb", position: "DEF", label: "ЛЗ", subRole: "Левый защитник", side: "left", x: 16, y: 72 },
      { id: "lcb", position: "DEF", label: "ЦЗЛ", subRole: "Центральный защитник", side: "left", x: 38, y: 75 },
      { id: "rcb", position: "DEF", label: "ЦЗП", subRole: "Центральный защитник", side: "right", x: 62, y: 75 },
      { id: "rb", position: "DEF", label: "ПЗЩ", subRole: "Правый защитник", side: "right", x: 84, y: 72 },
      { id: "cdm", position: "MID", label: "ОП", subRole: "Опорный полузащитник", side: "center", x: 50, y: 56 },
      { id: "lcm", position: "MID", label: "ЦПЛ", subRole: "Центральный полузащитник", side: "left", x: 30, y: 45 },
      { id: "rcm", position: "MID", label: "ЦПП", subRole: "Плеймейкер / Атакующий", side: "right", x: 70, y: 45 },
      { id: "lw", position: "FWD", label: "ЛН", subRole: "Крайний нападающий", side: "left", x: 20, y: 24 },
      { id: "st", position: "FWD", label: "ЦН", subRole: "Центрфорвард", side: "center", x: 50, y: 17 },
      { id: "rw", position: "FWD", label: "ПН", subRole: "Крайний нападающий", side: "right", x: 80, y: 24 },
    ],
  },
];

export function getFormationsForFormat(format: MatchFormat): TacticalFormation[] {
  return MATCH_FORMATIONS.filter((f) => f.format === format);
}

export function getFormationById(
  formationId?: string,
  format?: MatchFormat,
): TacticalFormation {
  if (formationId) {
    const exact = MATCH_FORMATIONS.find((f) => f.id === formationId);
    if (exact) return exact;
  }
  if (format) {
    const byFormat = MATCH_FORMATIONS.find((f) => f.format === format);
    if (byFormat) return byFormat;
  }
  return MATCH_FORMATIONS[0];
}

export function suggestMatchFormatByBirthYear(birthYear?: number): {
  format: MatchFormat;
  formationId: string;
} {
  const currentYear = new Date().getFullYear();
  const age = birthYear ? currentYear - birthYear : 8;
  if (age <= 8) return { format: "5x5", formationId: "5x5_diamond" };
  if (age === 9) return { format: "6x6", formationId: "6x6_classic" };
  if (age <= 11) return { format: "7x7", formationId: "7x7_classic" };
  if (age <= 13) return { format: "8x8", formationId: "8x8_classic" };
  return { format: "11x11", formationId: "11x11_433" };
}

/**
 * Extracts a clean branch / filial label for a student using their regular group & venues.
 */
export function resolveClientBranch(
  client: Client,
  groups: TrainingGroup[],
  counterparties: Counterparty[],
): string {
  const rawGroupName = client.groupName?.trim();
  if (!rawGroupName) return "Без филиала";

  const regularGroup = groups.find(
    (g) =>
      !g.isSelectTeam &&
      g.name.trim().toLowerCase() === rawGroupName.toLowerCase(),
  );

  if (regularGroup?.venueId) {
    const cp = counterparties.find((c) => c.id === regularGroup.venueId);
    if (cp?.name) return cp.name.trim();
  }

  // Strip trailing year / age bracket like "(2018-2019)" or "(2018)" to get branch/filial name
  const formatted = formatGroupNameDisplay(rawGroupName);
  const stripped = formatted
    .replace(/\s*\([^)]*\d{4}[^)]*\)\s*$/g, "")
    .replace(/\s*\b20\d{2}(\s*[-–]\s*20\d{2})?\b\s*$/g, "")
    .trim();

  return stripped || formatted;
}

export interface PlayerRoleAnalysis {
  clientId: string;
  recommendedPosition: PlayerPosition;
  recommendedSubRole: string;
  scores: Record<Exclude<PlayerPosition, "UNI">, number>;
  reasons: string[];
  captainScore: number;
  attendancePct: number;
  avgSkill: number;
  historicalPositions: PlayerPosition[];
  hasMedicalCert: boolean;
  hasInsurance: boolean;
}

const KEYWORD_RULES: {
  position: PlayerPosition;
  patterns: RegExp[];
  reason: string;
  boost: number;
}[] = [
  {
    position: "GK",
    patterns: [/вратар/i, /голкипер/i, /перчатк/i, /в рамк/i, /на воротах/i],
    reason: "Указан опыт игры вратарём в заметках",
    boost: 36,
  },
  {
    position: "DEF",
    patterns: [/защит/i, /отбор/i, /подкат/i, /цепк/i, /оборон/i, /опек/i],
    reason: "Отмечены сильные оборонительные качества",
    boost: 24,
  },
  {
    position: "MID",
    patterns: [/полузащит/i, /плеймейкер/i, /видение поля/i, /хороший пас/i, /передач/i, /центр поля/i, /вингер/i],
    reason: "Отмечено видение поля и культура паса",
    boost: 24,
  },
  {
    position: "FWD",
    patterns: [/напада/i, /форвард/i, /бомбардир/i, /голеадор/i, /сильный удар/i, /забива/i, /атак/i],
    reason: "Отмечены атакующие навыки и удар",
    boost: 24,
  },
  {
    position: "UNI",
    patterns: [/универсал/i, /на любой позиции/i],
    reason: "Указана универсальность игрока",
    boost: 14,
  },
];

function normalizeMetricTo100(val?: number): number {
  if (typeof val !== "number" || isNaN(val) || val <= 0) return 60;
  // CRM stores metrics on 1..5 or 0..100 scale
  if (val <= 5) return Math.min(100, Math.max(20, Math.round((val / 5) * 100)));
  if (val <= 10) return Math.min(100, Math.max(20, Math.round((val / 10) * 100)));
  return Math.min(100, Math.max(20, Math.round(val)));
}

export function analyzePlayerRoleFit(
  client: Client,
  allGroups: TrainingGroup[],
  trainingSessions: TrainingSessionProtocol[],
  excludeGroupId?: string,
): PlayerRoleAnalysis {
  const latestReport =
    client.progressReports && client.progressReports.length > 0
      ? [...client.progressReports].sort((a, b) =>
          (b.createdAt || "").localeCompare(a.createdAt || ""),
        )[0]
      : undefined;

  const tech = normalizeMetricTo100(
    latestReport?.radarScores?.technique ?? client.progress?.technique,
  );
  const tact = normalizeMetricTo100(
    latestReport?.radarScores?.tactics ?? client.progress?.tactics,
  );
  const phys = normalizeMetricTo100(
    latestReport?.radarScores?.physical ?? client.progress?.physical,
  );
  const disc = normalizeMetricTo100(
    latestReport?.radarScores?.discipline ?? client.progress?.discipline,
  );
  const speed = normalizeMetricTo100(
    latestReport?.radarScores?.speed ??
      ((client.progress?.physical || 3) * 0.6 +
        (client.progress?.technique || 3) * 0.4),
  );
  const teamwork = normalizeMetricTo100(
    latestReport?.radarScores?.teamwork ??
      ((client.progress?.tactics || 3) * 0.5 +
        (client.progress?.discipline || 3) * 0.5),
  );

  // Base football model scores (0-100)
  const scores: Record<Exclude<PlayerPosition, "UNI">, number> = {
    GK: Math.round(disc * 0.34 + phys * 0.3 + tact * 0.24 + tech * 0.12 - 8), // slightly lower baseline unless indicated
    DEF: Math.round(disc * 0.34 + phys * 0.34 + tact * 0.22 + tech * 0.1),
    MID: Math.round(tact * 0.34 + tech * 0.28 + teamwork * 0.22 + phys * 0.16),
    FWD: Math.round(tech * 0.36 + speed * 0.34 + tact * 0.18 + phys * 0.12),
  };

  const reasons: string[] = [];

  // 1. Saved preferred/secondary position from player profile
  if (client.preferredPosition && client.preferredPosition !== "UNI") {
    scores[client.preferredPosition] = Math.min(
      99,
      scores[client.preferredPosition] + 28,
    );
    reasons.push(
      `Основное амплуа в профиле: ${POSITION_META[client.preferredPosition].label}`,
    );
  }
  if (client.secondaryPosition && client.secondaryPosition !== "UNI") {
    scores[client.secondaryPosition] = Math.min(
      96,
      scores[client.secondaryPosition] + 14,
    );
  }

  // 2. Historical roles across other select teams
  const historicalPositions: PlayerPosition[] = [];
  for (const grp of allGroups) {
    if (!grp.isSelectTeam || grp.id === excludeGroupId) continue;
    const member = grp.selectTeamRoster?.[client.id];
    if (member?.position) {
      historicalPositions.push(member.position);
      if (member.position !== "UNI") {
        scores[member.position] = Math.min(98, scores[member.position] + 16);
      }
    }
  }
  if (historicalPositions.length > 0) {
    const primaryHist = historicalPositions[0];
    reasons.push(
      `Опыт в сборных: ${POSITION_META[primaryHist].label}`,
    );
  }

  // 3. Coach notes & latest report strengths keyword detection
  const combinedText = [
    client.notes || "",
    latestReport?.overallSummary || "",
    ...(latestReport?.strengths || []),
  ].join(" ");

  let hasCaptainKeyword = false;
  if (/капитан|лидер|вед[её]т команду|организатор/i.test(combinedText)) {
    hasCaptainKeyword = true;
  }

  for (const rule of KEYWORD_RULES) {
    if (rule.patterns.some((p) => p.test(combinedText))) {
      if (rule.position !== "UNI") {
        scores[rule.position] = Math.min(99, scores[rule.position] + rule.boost);
      }
      reasons.push(rule.reason);
    }
  }

  // 4. Attendance calculation from client.attendance + trainingSessions
  let presentCount = 0;
  let totalCount = 0;
  if (client.attendance && client.attendance.length > 0) {
    totalCount = client.attendance.length;
    presentCount = client.attendance.filter((a) => a.status === "present").length;
  } else {
    for (const s of trainingSessions) {
      const rec = s.records?.find((r) => r.clientId === client.id);
      if (rec) {
        totalCount++;
        if (rec.status === "present" || rec.status === "trial_free") {
          presentCount++;
        }
      }
    }
  }
  const attendancePct =
    totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 80;

  // Pick top position
  const ordered = (["FWD", "MID", "DEF", "GK"] as const)
    .map((pos) => ({ pos, score: scores[pos] }))
    .sort((a, b) => b.score - a.score);

  const best = ordered[0];
  const second = ordered[1];

  let recommendedPosition: PlayerPosition = best.pos;
  // If no strong preference/keyword and top 3 outfield positions are very close, mention versatility
  if (
    client.preferredPosition === "UNI" ||
    (!client.preferredPosition &&
      historicalPositions.length === 0 &&
      best.pos !== "GK" &&
      Math.abs(best.score - second.score) <= 2 &&
      tech >= 75 &&
      tact >= 75 &&
      phys >= 75)
  ) {
    recommendedPosition = "UNI";
  }

  // Add metric-based explanation if reasons list is sparse
  if (reasons.length === 0) {
    if (recommendedPosition === "FWD") {
      reasons.push(
        `Сильная техника (${(tech / 20).toFixed(1)}) и скорость — высокая эффективность в атаке`,
      );
    } else if (recommendedPosition === "MID") {
      reasons.push(
        `Высокая тактика (${(tact / 20).toFixed(1)}) и командное взаимодействие — оптимален в центре`,
      );
    } else if (recommendedPosition === "DEF") {
      reasons.push(
        `Высокая дисциплина (${(disc / 20).toFixed(1)}) и физика (${(phys / 20).toFixed(1)}) — надёжен в защите`,
      );
    } else if (recommendedPosition === "GK") {
      reasons.push(`Спокойствие, дисциплина и реакция подходят для игры в воротах`);
    } else {
      reasons.push(`Ровные показатели по всем линиям — закроет любую позицию`);
    }
  }

  // Sub-role recommendation using dominant foot
  let recommendedSubRole = POSITION_META[recommendedPosition].subRoles[0];
  if (recommendedPosition === "DEF") {
    if (client.dominantFoot === "left") recommendedSubRole = "Левый защитник";
    else if (phys >= 80 && disc >= 80) recommendedSubRole = "Центральный защитник";
    else recommendedSubRole = "Правый защитник";
  } else if (recommendedPosition === "MID") {
    if (client.dominantFoot === "left") recommendedSubRole = "Левый вингер";
    else if (tact >= 82 && tech >= 80) recommendedSubRole = "Плеймейкер / Атакующий";
    else if (disc >= 80 && phys >= 78) recommendedSubRole = "Опорный полузащитник";
    else recommendedSubRole = "Центральный полузащитник";
  } else if (recommendedPosition === "FWD") {
    if (client.dominantFoot === "left") recommendedSubRole = "Крайний нападающий";
    else recommendedSubRole = "Центрфорвард";
  }

  const avgSkill = Number(
    (
      ((client.progress?.technique || 3) +
        (client.progress?.tactics || 3) +
        (client.progress?.physical || 3) +
        (client.progress?.discipline || 3)) /
      4
    ).toFixed(1),
  );

  const captainScore = Math.min(
    100,
    Math.round(
      disc * 0.35 +
        teamwork * 0.3 +
        tact * 0.2 +
        attendancePct * 0.15 +
        (hasCaptainKeyword ? 15 : 0),
    ),
  );

  return {
    clientId: client.id,
    recommendedPosition,
    recommendedSubRole,
    scores,
    reasons: reasons.slice(0, 3),
    captainScore,
    attendancePct,
    avgSkill,
    historicalPositions,
    hasMedicalCert: Boolean(client.medicalCertificateUrl),
    hasInsurance: Boolean(client.insuranceUrl),
  };
}

/**
 * Smart Squad Auto-Balancer:
 * Fills tactical formation starting slots with the optimal available players
 * (prioritizing confirmed participants, respecting locked manual roles if requested),
 * balances bench players across lines, and optionally nominates a captain.
 */
export function smartAssignTeamRoles(params: {
  roster: Record<string, SelectTeamMember>;
  memberIds: string[];
  clients: Client[];
  formation: TacticalFormation;
  allGroups: TrainingGroup[];
  trainingSessions: TrainingSessionProtocol[];
  teamId: string;
  mode: "unassigned_only" | "rebalance_all";
  autoPickCaptain?: boolean;
  actorName: string;
  actorRole: "admin" | "director" | "manager" | "trainer";
}): Record<string, SelectTeamMember> {
  const {
    roster,
    memberIds,
    clients,
    formation,
    allGroups,
    trainingSessions,
    teamId,
    mode,
    autoPickCaptain = true,
    actorName,
    actorRole,
  } = params;

  const clientMap = new Map(clients.map((c) => [c.id, c]));
  const analyses = new Map<string, PlayerRoleAnalysis>();
  const nowIso = new Date().toISOString();

  // Build base roster entries
  const nextRoster: Record<string, SelectTeamMember> = {};
  for (const cid of memberIds) {
    const client = clientMap.get(cid);
    if (!client) continue;
    analyses.set(
      cid,
      analyzePlayerRoleFit(client, allGroups, trainingSessions, teamId),
    );
    const existing = roster[cid];
    nextRoster[cid] = existing
      ? { ...existing }
      : {
          clientId: cid,
          participationStatus: "pending",
          paymentStatus: "unpaid",
        };
  }

  // Priority pool for starters: confirmed first, then pending, then reserve (never declined)
  const participationPriority: Record<SelectTeamParticipationStatus, number> = {
    confirmed: 3,
    pending: 2,
    reserve: 1,
    declined: 0,
  };

  const eligibleIds = memberIds.filter((cid) => {
    const m = nextRoster[cid];
    return m && m.participationStatus !== "declined" && clientMap.has(cid);
  });

  const usedSlots = new Set<string>();
  const assignedStarterIds = new Set<string>();

  if (mode === "rebalance_all") {
    for (const cid of memberIds) {
      if (nextRoster[cid]) {
        nextRoster[cid].pitchSlotId = undefined;
        nextRoster[cid].lineupStatus = "bench";
      }
    }
  } else {
    // Keep existing valid starting slot assignments in unassigned_only mode
    for (const cid of eligibleIds) {
      const m = nextRoster[cid];
      if (
        m.lineupStatus === "starter" &&
        m.pitchSlotId &&
        formation.slots.some((s) => s.id === m.pitchSlotId) &&
        !usedSlots.has(m.pitchSlotId)
      ) {
        usedSlots.add(m.pitchSlotId);
        assignedStarterIds.add(cid);
      }
    }
  }

  // Fill scarce positions first: GK -> DEF -> FWD -> MID
  const slotOrderPriority: Record<Exclude<PlayerPosition, "UNI">, number> = {
    GK: 0,
    DEF: 1,
    FWD: 2,
    MID: 3,
  };

  const openSlots = [...formation.slots]
    .filter((s) => !usedSlots.has(s.id))
    .sort(
      (a, b) => slotOrderPriority[a.position] - slotOrderPriority[b.position],
    );

  for (const slot of openSlots) {
    const candidates = eligibleIds.filter((cid) => !assignedStarterIds.has(cid));
    if (candidates.length === 0) break;

    let bestCid: string | null = null;
    let bestUtility = -Infinity;

    for (const cid of candidates) {
      const m = nextRoster[cid];
      const client = clientMap.get(cid)!;
      const analysis = analyses.get(cid)!;

      // Strongly prioritize confirmed players for starting XI/V
      const pWeight = participationPriority[m.participationStatus] * 120;
      let fitScore = analysis.scores[slot.position];

      // In unassigned_only mode, heavily favor players who already have this position manually chosen
      if (mode === "unassigned_only" && m.position === slot.position) {
        fitScore += 35;
      }

      // Bonus for matching dominant foot to left/right wing/back slots
      if (slot.side === "left" && client.dominantFoot === "left") {
        fitScore += 10;
      } else if (slot.side === "right" && client.dominantFoot === "right") {
        fitScore += 5;
      }

      // Avoid putting a strong natural striker in GK unless needed
      if (
        slot.position === "GK" &&
        analysis.recommendedPosition !== "GK" &&
        analysis.scores.GK < 65
      ) {
        fitScore -= 10;
      }

      const utility = pWeight + fitScore;
      if (utility > bestUtility) {
        bestUtility = utility;
        bestCid = cid;
      }
    }

    if (bestCid) {
      assignedStarterIds.add(bestCid);
      usedSlots.add(slot.id);
      nextRoster[bestCid] = {
        ...nextRoster[bestCid],
        position: slot.position,
        subRole: slot.subRole,
        lineupStatus: "starter",
        pitchSlotId: slot.id,
        updatedAt: nowIso,
        updatedBy: actorName,
        updatedByRole: actorRole,
      };
    }
  }

  // Assign balanced roles to bench & remaining players
  for (const cid of memberIds) {
    const m = nextRoster[cid];
    if (!m || assignedStarterIds.has(cid)) continue;
    const analysis = analyses.get(cid);
    if (!analysis) continue;

    if (mode === "rebalance_all" || !m.position) {
      nextRoster[cid] = {
        ...m,
        position: analysis.recommendedPosition,
        subRole: analysis.recommendedSubRole,
        lineupStatus: "bench",
        pitchSlotId: undefined,
        updatedAt: nowIso,
        updatedBy: actorName,
        updatedByRole: actorRole,
      };
    } else {
      nextRoster[cid] = {
        ...m,
        lineupStatus: "bench",
        pitchSlotId: undefined,
      };
    }
  }

  // Auto-pick captain if none selected yet
  if (autoPickCaptain) {
    const hasCaptain = memberIds.some(
      (cid) =>
        nextRoster[cid]?.isCaptain &&
        nextRoster[cid]?.participationStatus !== "declined",
    );
    if (!hasCaptain && eligibleIds.length > 0) {
      const topCaptain = [...eligibleIds].sort((a, b) => {
        const pDiff =
          participationPriority[nextRoster[b].participationStatus] -
          participationPriority[nextRoster[a].participationStatus];
        if (pDiff !== 0) return pDiff;
        return (
          (analyses.get(b)?.captainScore || 0) -
          (analyses.get(a)?.captainScore || 0)
        );
      })[0];
      if (topCaptain && nextRoster[topCaptain]) {
        nextRoster[topCaptain].isCaptain = true;
      }
    }
  }

  return nextRoster;
}

export interface SquadDiagnostic {
  level: "warning" | "info" | "success";
  title: string;
  detail: string;
}

export function analyzeSquadReadiness(
  team: TrainingGroup,
  clients: Client[],
  formation: TacticalFormation,
): {
  diagnostics: SquadDiagnostic[];
  counts: {
    total: number;
    confirmed: number;
    pending: number;
    reserve: number;
    declined: number;
    paid: number;
    unpaidConfirmed: number;
    expectedFeeTotal: number;
    collectedFeeTotal: number;
    byPosition: Record<PlayerPosition | "NONE", number>;
  };
} {
  const clientMap = new Map(clients.map((c) => [c.id, c]));
  const ids = (team.selectedClientIds || []).filter((id) => clientMap.has(id));
  const roster = team.selectTeamRoster || {};
  const defaultFee = Number(team.competitionFee || 0);

  let confirmed = 0;
  let pending = 0;
  let reserve = 0;
  let declined = 0;
  let paid = 0;
  let unpaidConfirmed = 0;
  let expectedFeeTotal = 0;
  let collectedFeeTotal = 0;
  let missingMedCount = 0;

  const byPosition: Record<PlayerPosition | "NONE", number> = {
    GK: 0,
    DEF: 0,
    MID: 0,
    FWD: 0,
    UNI: 0,
    NONE: 0,
  };

  const confirmedByPos: Record<PlayerPosition | "NONE", number> = {
    GK: 0,
    DEF: 0,
    MID: 0,
    FWD: 0,
    UNI: 0,
    NONE: 0,
  };

  for (const cid of ids) {
    const client = clientMap.get(cid)!;
    const m: SelectTeamMember = roster[cid] || {
      clientId: cid,
      participationStatus: "pending",
      paymentStatus: "unpaid",
    };

    if (m.participationStatus === "confirmed") confirmed++;
    else if (m.participationStatus === "pending") pending++;
    else if (m.participationStatus === "reserve") reserve++;
    else if (m.participationStatus === "declined") declined++;

    if (m.participationStatus !== "declined") {
      const posKey = m.position || "NONE";
      byPosition[posKey]++;
      if (m.participationStatus === "confirmed") {
        confirmedByPos[posKey]++;
        if (!client.medicalCertificateUrl) missingMedCount++;
      }
    }

    if (m.paymentStatus === "paid") {
      paid++;
      collectedFeeTotal +=
        typeof m.paidAmount === "number" ? m.paidAmount : defaultFee;
    } else if (m.paymentStatus === "partial") {
      collectedFeeTotal += Number(m.paidAmount || 0);
    }

    if (m.participationStatus === "confirmed" && m.paymentStatus !== "exempt") {
      expectedFeeTotal += defaultFee;
      if (m.paymentStatus !== "paid") {
        unpaidConfirmed++;
      }
    }
  }

  const diagnostics: SquadDiagnostic[] = [];

  if (ids.length === 0) {
    diagnostics.push({
      level: "info",
      title: "Состав сборной ещё не набран",
      detail: "Добавьте игроков из разных филиалов подходящего года рождения.",
    });
  } else {
    if (confirmed < formation.startersCount) {
      const missing = formation.startersCount - confirmed;
      diagnostics.push({
        level: "warning",
        title: `Не хватает ${missing} чел. до полного стартового состава (${formation.format})`,
        detail: `Подтвердили участие ${confirmed} из ${formation.startersCount} необходимых (ожидают ответа: ${pending}, в резерве: ${reserve}).`,
      });
    }

    if (byPosition.GK === 0) {
      diagnostics.push({
        level: "warning",
        title: "В заявке не назначен вратарь (ВР)",
        detail: "Назначьте вратаря вручную или запустите «Умный подбор ролей».",
      });
    } else if (confirmed > 0 && confirmedByPos.GK === 0) {
      diagnostics.push({
        level: "warning",
        title: "Вратарь ещё не подтвердил участие",
        detail: "Уточните статус голкипера или подготовьте дублёра из состава.",
      });
    }

    if (byPosition.NONE > 0) {
      diagnostics.push({
        level: "info",
        title: `У ${byPosition.NONE} игроков не определены роли на поле`,
        detail: "Используйте умный подбор ролей или выберите амплуа в таблице.",
      });
    }

    if (byPosition.FWD >= 3 && byPosition.DEF === 0) {
      diagnostics.push({
        level: "warning",
        title: "Дисбаланс линий: нет защитников",
        detail: "В составе много игроков атаки, но оборонительная линия не закрыта.",
      });
    }

    if (defaultFee > 0 && unpaidConfirmed > 0) {
      const debt = Math.max(0, expectedFeeTotal - collectedFeeTotal);
      diagnostics.push({
        level: "warning",
        title: `Не сдан взнос у ${unpaidConfirmed} подтверждённых участников`,
        detail: `Осталось собрать ${debt.toLocaleString("ru-RU")} ₽ (взнос ${defaultFee.toLocaleString("ru-RU")} ₽ с игрока).`,
      });
    }

    if (missingMedCount > 0) {
      diagnostics.push({
        level: "info",
        title: `Нет медсправки в базе у ${missingMedCount} подтверждённых игроков`,
        detail: "Проверьте наличие справок-допусков перед выездом на турнир.",
      });
    }

    if (
      diagnostics.length === 0 &&
      confirmed >= formation.startersCount &&
      byPosition.GK >= 1
    ) {
      diagnostics.push({
        level: "success",
        title: "Сборная готова к соревнованию",
        detail: `Стартовый состав (${formation.format}) укомплектован, роли распределены, взносы собраны.`,
      });
    }
  }

  return {
    diagnostics,
    counts: {
      total: ids.length,
      confirmed,
      pending,
      reserve,
      declined,
      paid,
      unpaidConfirmed,
      expectedFeeTotal,
      collectedFeeTotal,
      byPosition,
    },
  };
}

/**
 * Generates clean plain-text export for Telegram / WhatsApp team chats
 */
export function formatSelectTeamShareText(
  team: TrainingGroup,
  clients: Client[],
  groups: TrainingGroup[],
  counterparties: Counterparty[],
): string {
  const clientMap = new Map(clients.map((c) => [c.id, c]));
  const roster = team.selectTeamRoster || {};
  const ids = (team.selectedClientIds || []).filter((id) => clientMap.has(id));

  const lines: string[] = [];
  lines.push(`🏆 ${team.name}`);
  if (team.targetCompetition) {
    lines.push(`Соревнование: ${team.targetCompetition}`);
  }
  const metaParts: string[] = [];
  if (team.competitionDate) {
    const [y, m, d] = team.competitionDate.split("-");
    metaParts.push(`Дата: ${d && m && y ? `${d}.${m}.${y}` : team.competitionDate}`);
  }
  if (team.competitionLocation) metaParts.push(`Место: ${team.competitionLocation}`);
  if (team.matchFormat) metaParts.push(`Формат: ${team.matchFormat}`);
  if (team.competitionFee) {
    metaParts.push(`Взнос: ${team.competitionFee.toLocaleString("ru-RU")} ₽`);
  }
  if (metaParts.length > 0) lines.push(metaParts.join(" · "));
  if (team.coachName) lines.push(`Тренер: ${team.coachName}`);
  lines.push("");

  const orderStatus: Record<SelectTeamParticipationStatus, number> = {
    confirmed: 0,
    pending: 1,
    reserve: 2,
    declined: 3,
  };

  const sorted = [...ids].sort((a, b) => {
    const ma = roster[a] || { participationStatus: "pending" as const };
    const mb = roster[b] || { participationStatus: "pending" as const };
    const sDiff =
      orderStatus[ma.participationStatus] - orderStatus[mb.participationStatus];
    if (sDiff !== 0) return sDiff;
    const ca = clientMap.get(a)!;
    const cb = clientMap.get(b)!;
    return `${ca.childSurname} ${ca.childName}`.localeCompare(
      `${cb.childSurname} ${cb.childName}`,
      "ru",
    );
  });

  const statusEmoji: Record<SelectTeamParticipationStatus, string> = {
    confirmed: "✅",
    pending: "⏳",
    reserve: "🔵",
    declined: "❌",
  };

  sorted.forEach((cid, idx) => {
    const c = clientMap.get(cid)!;
    const m = roster[cid] || {
      clientId: cid,
      participationStatus: "pending" as const,
      paymentStatus: "unpaid" as const,
    };
    const branch = resolveClientBranch(c, groups, counterparties);
    const posStr = m.position
      ? `[${POSITION_META[m.position].shortLabel}${m.subRole ? ` · ${m.subRole}` : ""}]`
      : "[Роль не назначена]";
    const cap = m.isCaptain ? " (К)" : "";
    const num = m.jerseyNumber ? `#${m.jerseyNumber} ` : "";
    const payStr =
      m.paymentStatus === "paid"
        ? "оплачено"
        : m.paymentStatus === "partial"
          ? `частично (${m.paidAmount || 0} ₽)`
          : m.paymentStatus === "exempt"
            ? "льгота"
            : "не оплачено";

    lines.push(
      `${idx + 1}. ${statusEmoji[m.participationStatus]} ${num}${c.childSurname} ${c.childName}${cap} (${branch}) — ${posStr} — ${payStr}`,
    );
  });

  if (team.competitionResultLabel || team.competitionPlace) {
    const placeStr =
      team.competitionResultLabel ||
      `${team.competitionPlace} место${
        team.competitionTotalTeams ? ` из ${team.competitionTotalTeams}` : ""
      }`;
    lines.push(`🏅 Итог соревнований: ${placeStr}`);
  }
  if (team.competitionMatches && team.competitionMatches.length > 0) {
    lines.push("");
    lines.push("Матчи:");
    team.competitionMatches.forEach((m, i) => {
      const outcomeRu =
        m.outcome === "win"
          ? "Победа"
          : m.outcome === "draw"
            ? "Ничья"
            : "Поражение";
      const stagePart = m.stage ? ` (${m.stage})` : "";
      const penPart = m.decidedByPenalties ? " по пен." : "";
      lines.push(
        `${i + 1}. Амкар Юниор ${m.ourScore}:${m.opponentScore} ${m.opponent}${stagePart} — ${outcomeRu}${penPart}`,
      );
    });
  }

  return lines.join("\n");
}

export const MATCH_OUTCOME_META: Record<
  MatchOutcome,
  { label: string; shortLabel: string; textClass: string; bgClass: string }
> = {
  win: {
    label: "Победа",
    shortLabel: "В",
    textClass: "text-emerald-700",
    bgClass: "bg-emerald-50 border-emerald-200 text-emerald-800",
  },
  draw: {
    label: "Ничья",
    shortLabel: "Н",
    textClass: "text-amber-700",
    bgClass: "bg-amber-50 border-amber-200 text-amber-800",
  },
  loss: {
    label: "Поражение",
    shortLabel: "П",
    textClass: "text-red-700",
    bgClass: "bg-red-50 border-red-200 text-red-800",
  },
};

export function computeMatchOutcome(
  ourScore: number,
  opponentScore: number,
  penaltyWinner?: "our" | "opponent" | "none",
): MatchOutcome {
  if (ourScore > opponentScore) return "win";
  if (ourScore < opponentScore) return "loss";
  if (penaltyWinner === "our") return "win";
  if (penaltyWinner === "opponent") return "loss";
  return "draw";
}

export function formatCompetitionPlaceLabel(
  place?: number,
  totalTeams?: number,
  customLabel?: string,
): string {
  if (customLabel && customLabel.trim()) {
    return customLabel.trim();
  }
  if (place && place > 0) {
    return totalTeams && totalTeams >= place
      ? `${place} место из ${totalTeams}`
      : `${place} место`;
  }
  return "";
}

export interface TeamMatchSummary {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  attendedPlayersCount: number;
}

export function getTeamMatchSummary(team: TrainingGroup): TeamMatchSummary {
  const matches = team.competitionMatches || [];
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;

  for (const m of matches) {
    if (m.outcome === "win") wins++;
    else if (m.outcome === "draw") draws++;
    else losses++;
    goalsFor += Number(m.ourScore || 0);
    goalsAgainst += Number(m.opponentScore || 0);
  }

  const roster = team.selectTeamRoster || {};
  const attendedSet = new Set<string>();
  for (const cid of team.selectedClientIds || []) {
    if (roster[cid]?.attendedCompetition) {
      attendedSet.add(cid);
    }
  }
  for (const m of matches) {
    for (const cid of m.participantClientIds || []) {
      attendedSet.add(cid);
    }
  }

  return {
    played: matches.length,
    wins,
    draws,
    losses,
    goalsFor,
    goalsAgainst,
    attendedPlayersCount: attendedSet.size,
  };
}

export interface PlayerTournamentRecord {
  teamId: string;
  teamName: string;
  competitionName: string;
  date?: string;
  endDate?: string;
  location?: string;
  place?: number;
  totalTeams?: number;
  resultLabel: string;
  resultNotes?: string;
  playerPosition?: PlayerPosition;
  playerSubRole?: string;
  isCaptain?: boolean;
  matches: {
    id: string;
    date?: string;
    stage?: string;
    opponent: string;
    ourScore: number;
    opponentScore: number;
    outcome: MatchOutcome;
    decidedByPenalties?: boolean;
    playerGoals: number;
    notes?: string;
  }[];
  wins: number;
  draws: number;
  losses: number;
  goalsScored: number;
}

export interface PlayerCompetitionStats {
  clientId: string;
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
  goalsScored: number;
  tournamentsCount: number;
  podiumsCount: number; // 1st, 2nd, or 3rd place finishes
  bestPlace: number | null;
  tournaments: PlayerTournamentRecord[];
}

/**
 * Computes complete competition history & cumulative W/D/L statistics for a single child
 * across all Select Teams where the child factually participated.
 */
export function getPlayerCompetitionStats(
  clientId: string,
  allGroups: TrainingGroup[],
): PlayerCompetitionStats {
  let gamesPlayed = 0;
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let goalsScored = 0;
  let podiumsCount = 0;
  let bestPlace: number | null = null;
  const tournaments: PlayerTournamentRecord[] = [];

  const selectTeams = allGroups
    .filter((g) => Boolean(g.isSelectTeam))
    .sort((a, b) =>
      (b.competitionDate || "").localeCompare(a.competitionDate || ""),
    );

  for (const team of selectTeams) {
    const rosterEntry = team.selectTeamRoster?.[clientId];
    const allMatches = team.competitionMatches || [];

    // Determine which matches this player played in
    const playedMatches = allMatches.filter((m) => {
      if (m.participantClientIds && m.participantClientIds.length > 0) {
        return m.participantClientIds.includes(clientId);
      }
      // Fallback: if match has no explicit per-match player list, include players marked as attended
      return rosterEntry?.attendedCompetition === true;
    });

    const factuallyParticipated =
      rosterEntry?.attendedCompetition === true || playedMatches.length > 0;

    if (!factuallyParticipated) continue;

    // Only surface tournament in history if attended OR results/matches were logged
    let tWins = 0;
    let tDraws = 0;
    let tLosses = 0;
    let tGoals = 0;

    const matchDetails = playedMatches.map((m) => {
      if (m.outcome === "win") tWins++;
      else if (m.outcome === "draw") tDraws++;
      else tLosses++;

      const pGoals = Number(m.goalsByClientId?.[clientId] || 0);
      tGoals += pGoals;

      return {
        id: m.id,
        date: m.date,
        stage: m.stage,
        opponent: m.opponent,
        ourScore: m.ourScore,
        opponentScore: m.opponentScore,
        outcome: m.outcome,
        decidedByPenalties: m.decidedByPenalties,
        playerGoals: pGoals,
        notes: m.notes,
      };
    });

    gamesPlayed += matchDetails.length;
    wins += tWins;
    draws += tDraws;
    losses += tLosses;
    goalsScored += tGoals;

    if (team.competitionPlace && team.competitionPlace > 0) {
      if (team.competitionPlace <= 3) podiumsCount++;
      if (bestPlace === null || team.competitionPlace < bestPlace) {
        bestPlace = team.competitionPlace;
      }
    }

    const resultLabel = formatCompetitionPlaceLabel(
      team.competitionPlace,
      team.competitionTotalTeams,
      team.competitionResultLabel,
    );

    tournaments.push({
      teamId: team.id,
      teamName: team.name,
      competitionName: team.targetCompetition || team.name,
      date: team.competitionDate,
      endDate: team.competitionEndDate,
      location: team.competitionLocation,
      place: team.competitionPlace,
      totalTeams: team.competitionTotalTeams,
      resultLabel,
      resultNotes: team.competitionResultNotes,
      playerPosition: rosterEntry?.position,
      playerSubRole: rosterEntry?.subRole,
      isCaptain: rosterEntry?.isCaptain,
      matches: matchDetails,
      wins: tWins,
      draws: tDraws,
      losses: tLosses,
      goalsScored: tGoals,
    });
  }

  const winRate =
    gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0;

  return {
    clientId,
    gamesPlayed,
    wins,
    draws,
    losses,
    winRate,
    goalsScored,
    tournamentsCount: tournaments.length,
    podiumsCount,
    bestPlace,
    tournaments,
  };
}

export interface PlayerLeaderboardRow {
  client: Client;
  branch: string;
  stats: PlayerCompetitionStats;
}

export function getAllPlayersCompetitionLeaderboard(
  clients: Client[],
  allGroups: TrainingGroup[],
  counterparties: Counterparty[],
  filterTeamId?: string,
): PlayerLeaderboardRow[] {
  const targetGroups = filterTeamId
    ? allGroups.filter((g) => g.id === filterTeamId)
    : allGroups;

  const relevantIds = new Set<string>();
  for (const g of targetGroups) {
    if (!g.isSelectTeam) continue;
    for (const cid of g.selectedClientIds || []) {
      relevantIds.add(cid);
    }
    for (const m of g.competitionMatches || []) {
      for (const cid of m.participantClientIds || []) {
        relevantIds.add(cid);
      }
    }
  }

  const rows: PlayerLeaderboardRow[] = [];
  for (const client of clients) {
    if (!relevantIds.has(client.id)) continue;
    const stats = getPlayerCompetitionStats(client.id, targetGroups);
    if (stats.tournamentsCount === 0 && stats.gamesPlayed === 0) continue;
    const branch = resolveClientBranch(client, allGroups, counterparties);
    rows.push({ client, branch, stats });
  }

  return rows.sort((a, b) => {
    if (b.stats.gamesPlayed !== a.stats.gamesPlayed) {
      return b.stats.gamesPlayed - a.stats.gamesPlayed;
    }
    if (b.stats.wins !== a.stats.wins) {
      return b.stats.wins - a.stats.wins;
    }
    if (b.stats.tournamentsCount !== a.stats.tournamentsCount) {
      return b.stats.tournamentsCount - a.stats.tournamentsCount;
    }
    return `${a.client.childSurname} ${a.client.childName}`.localeCompare(
      `${b.client.childSurname} ${b.client.childName}`,
      "ru",
    );
  });
}

