import { formatGroupNameDisplay } from "./formatters";
import { parseScheduleString, parseTimeRangeMinutes } from "./scheduleParser";

/**
 * Normalizes any date string (ISO timestamp, YYYY-MM-DD, DD.MM.YYYY, DD.MM.YY)
 * into a standard 'YYYY-MM-DD' format.
 */
export function normalizeDateToYMD(d?: string | null): string {
  if (!d) return "";
  const s = d.trim();

  // 1. Match YYYY-MM-DD (or with time e.g. 2026-09-23T12:00:00)
  const ymdMatch = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = ymdMatch[2].padStart(2, "0");
    const day = ymdMatch[3].padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  // 2. Match DD.MM.YYYY
  const dmyMatch = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, "0");
    const m = dmyMatch[2].padStart(2, "0");
    const y = dmyMatch[3];
    return `${y}-${m}-${day}`;
  }

  // 3. Match DD.MM.YY
  const dmyShortMatch = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2})$/);
  if (dmyShortMatch) {
    const day = dmyShortMatch[1].padStart(2, "0");
    const m = dmyShortMatch[2].padStart(2, "0");
    const y = `20${dmyShortMatch[3]}`;
    return `${y}-${m}-${day}`;
  }

  return s;
}

/**
 * Converts standard YYYY-MM-DD to Russian DD.MM.YYYY format
 */
export function formatYMDToRussian(ymd: string): string {
  const norm = normalizeDateToYMD(ymd);
  if (!norm || !norm.includes("-")) return ymd;
  const [y, m, d] = norm.split("-");
  return `${d}.${m}.${y}`;
}

/**
 * Gets today's local date as 'YYYY-MM-DD'
 */
export function getLocalTodayYMD(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Checks if two dates match regardless of formatting (ISO, DD.MM.YYYY, YYYY-MM-DD)
 */
export function isDateMatch(
  dateA?: string | null,
  dateB?: string | null,
  dateFallback?: string | null
): boolean {
  const normA = normalizeDateToYMD(dateA) || normalizeDateToYMD(dateFallback);
  const normB = normalizeDateToYMD(dateB);
  if (!normA || !normB) return false;
  return normA === normB;
}

/**
 * Robust matching between training group references.
 * Handles IDs, trimmed names, display names, and handles space variations.
 */
export function isGroupMatch(
  sessionGroupId?: string | null,
  sessionGroupName?: string | null,
  targetGroupId?: string | null,
  targetGroupName?: string | null
): boolean {
  if (!sessionGroupId && !sessionGroupName) return false;
  if (!targetGroupId && !targetGroupName) return false;

  // 1. Direct ID match
  if (sessionGroupId && targetGroupId && sessionGroupId === targetGroupId) return true;

  // 2. ID matched against Name
  if (sessionGroupId && targetGroupName && sessionGroupId === targetGroupName) return true;
  if (sessionGroupName && targetGroupId && sessionGroupName === targetGroupId) return true;

  // 3. Name comparison with spaces normalization
  const sName = (sessionGroupName || "").replace(/\s+/g, " ").trim().toLowerCase();
  const tName = (targetGroupName || "").replace(/\s+/g, " ").trim().toLowerCase();
  if (sName && tName) {
    if (sName === tName) return true;

    // Compare with display formatting applied
    const dispS = formatGroupNameDisplay(sessionGroupName).toLowerCase();
    const dispT = formatGroupNameDisplay(targetGroupName).toLowerCase();
    if (dispS === dispT) return true;

    // Compare stripping punctuation (e.g. "баумана 27 (2014-2017)" vs "баумана 27(2014 2017)")
    const strip = (str: string) => str.replace(/[^a-zа-я0-9]/gi, "");
    const strippedS = strip(sName);
    const strippedT = strip(tName);
    if (strippedS.length > 3 && strippedS === strippedT) return true;
  }

  return false;
}

/**
 * Determines whether a scheduled session is overdue ("вовремя не заполнили").
 * 
 * Rules:
 * 1. If date < today (in the past): ALWAYS overdue if not reported/cancelled.
 * 2. If date > today (future): NEVER overdue.
 * 3. If date === today:
 *    - Parses time slot to find end time.
 *    - If training has NOT finished yet (+ grace period), returns FALSE.
 *      (e.g., at the start of the day or before training finishes, it is NOT overdue).
 *    - If current local time >= end time + grace period, returns TRUE.
 * 
 * @param dateStr Target date (YYYY-MM-DD or other supported format)
 * @param timeSlot Optional time slot string, e.g. "18:00 - 19:00", "18:00", "Ср 18:00"
 * @param graceMinutes Minutes after scheduled end time before flagging as overdue (default: 20 min)
 */
export function isSessionOverdue(
  dateStr: string,
  timeSlot?: string | null,
  graceMinutes: number = 20
): boolean {
  const targetYMD = normalizeDateToYMD(dateStr);
  const todayYMD = getLocalTodayYMD();

  if (!targetYMD) return false;

  // 1. Past dates are always overdue
  if (targetYMD < todayYMD) {
    return true;
  }

  // 2. Future dates are never overdue
  if (targetYMD > todayYMD) {
    return false;
  }

  // 3. For TODAY: check whether current time has passed the end of the session
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  let endMinutes = 21 * 60; // Default fallback: 21:00 (end of evening sessions)

  if (timeSlot) {
    // Try parsing from slot using scheduleParser
    const parsedSlots = parseScheduleString(timeSlot);
    if (parsedSlots.length > 0 && parsedSlots[0].time) {
      const range = parseTimeRangeMinutes(parsedSlots[0].time);
      if (range) {
        endMinutes = range.end;
      }
    } else {
      const directRange = parseTimeRangeMinutes(timeSlot);
      if (directRange) {
        endMinutes = directRange.end;
      }
    }
  }

  // Training is only overdue if current time is past (endMinutes + graceMinutes)
  return currentMinutes >= (endMinutes + graceMinutes);
}
