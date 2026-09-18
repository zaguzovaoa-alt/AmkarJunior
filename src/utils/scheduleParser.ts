export interface ParsedScheduleSlot {
  day: string; // e.g. "Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"
  time: string; // e.g. "18:00" or "18:00 - 19:00" or "18-19"
  location?: string; // e.g. "Зал", "Поле", "Манеж"
  raw: string; // e.g. "Зал: Вт 18:00 - 19:00"
}

export interface ScheduleConflictDetail {
  day: string;
  conflictingGroupName: string;
  conflictingGroupVenue?: string;
  conflictingTime: string;
  newTime: string;
  overlapDescription: string;
}

const DAY_MAP: { [key: string]: string } = {
  'понедельник': 'Пн', 'пн': 'Пн', 'mon': 'Пн', 'monday': 'Пн',
  'вторник': 'Вт', 'вт': 'Вт', 'tue': 'Вт', 'tuesday': 'Вт',
  'среда': 'Ср', 'ср': 'Ср', 'wed': 'Ср', 'wednesday': 'Ср',
  'четверг': 'Чт', 'чт': 'Чт', 'thu': 'Чт', 'thursday': 'Чт',
  'пятница': 'Пт', 'пт': 'Пт', 'fri': 'Пт', 'friday': 'Пт',
  'суббота': 'Сб', 'сб': 'Сб', 'sat': 'Сб', 'saturday': 'Сб',
  'воскресенье': 'Вс', 'вс': 'Вс', 'sun': 'Вс', 'sunday': 'Вс',
};

export const RU_WEEKDAYS_MAP: { [key: string]: number } = {
  'Вс': 0, 'Пн': 1, 'Вт': 2, 'Ср': 3, 'Чт': 4, 'Пт': 5, 'Сб': 6
};

/**
 * Parses time string like "10:00-11:00", "18:00 - 19:00", "18-19", "10:00"
 * into minutes from start of day: { start, end }.
 */
export function parseTimeRangeMinutes(timeStr: string): { start: number; end: number } | null {
  if (!timeStr || !timeStr.trim()) return null;
  const clean = timeStr.trim().replace(/\./g, ':');

  // Match range: "18:00 - 19:00", "18:00-19:00", "18-19", "18:30-19:45"
  const rangeMatch = clean.match(/^(\d{1,2})(?::(\d{2}))?\s*[-–—]\s*(\d{1,2})(?::(\d{2}))?$/);
  if (rangeMatch) {
    const startH = parseInt(rangeMatch[1], 10);
    const startM = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : 0;
    const endH = parseInt(rangeMatch[3], 10);
    const endM = rangeMatch[4] ? parseInt(rangeMatch[4], 10) : 0;

    const start = startH * 60 + startM;
    let end = endH * 60 + endM;
    if (end <= start) {
      end = start + 60; // Default 1 hour duration if invalid range
    }
    return { start, end };
  }

  // Match single time: "18:00", "18:30", "18"
  const singleMatch = clean.match(/^(\d{1,2})(?::(\d{2}))?$/);
  if (singleMatch) {
    const startH = parseInt(singleMatch[1], 10);
    const startM = singleMatch[2] ? parseInt(singleMatch[2], 10) : 0;
    const start = startH * 60 + startM;
    const end = start + 60; // Default 1 hour duration
    return { start, end };
  }

  return null;
}

export function parseScheduleString(input: string): ParsedScheduleSlot[] {
  if (!input) return [];

  const results: ParsedScheduleSlot[] = [];
  
  // Case-insensitive regex to capture Optional Location: Weekday Time(range)
  // Supports formats like:
  // "Пн 18:00 - 19:00", "Пн 18:00", "Пн 18-19", "Манеж: Вт 19:00-20:00"
  const regex = /(?:([А-Яа-яA-Za-z0-9\s№_\-#().,]+):\s*)?(понедельник|вторник|среда|четверг|пятница|суббота|воскресенье|пн|вт|ср|чт|пт|сб|вс|mon|tue|wed|thu|fri|sat|sun)\s+(\d{1,2}(?:[:.]\d{2})?(?:\s*[-–—]\s*\d{1,2}(?:[:.]\d{2})?)?)/gi;

  let match;
  while ((match = regex.exec(input)) !== null) {
    const rawLocation = match[1] ? match[1].trim() : '';
    const rawDay = match[2];
    const time = match[3] ? match[3].replace(/\./g, ':').trim() : '';

    // Normalize location
    let location = '';
    if (rawLocation) {
      const words = rawLocation.split(/\s+/);
      const cleaned = words.filter(w => !/\d+/.test(w) && w !== '-' && w.length < 20);
      location = cleaned.slice(-2).join(' ').trim();
    }

    // Normalize Day of week
    const dayLower = rawDay.toLowerCase();
    const day = DAY_MAP[dayLower] || 'Пн';

    // Format normalized raw string
    const rawSlot = location ? `${location}: ${day} ${time}` : `${day} ${time}`;

    results.push({
      day,
      time,
      location: location || undefined,
      raw: rawSlot
    });
  }

  // Fallback if no matching parsed items but text is provided (handles manual simple formats)
  if (results.length === 0 && input.trim()) {
    const parts = input.split(/[,;\n]+/);
    for (const p of parts) {
      const trimmed = p.trim();
      if (!trimmed) continue;
      
      const subParts = trimmed.split(/\s+/);
      if (subParts.length >= 2) {
        let dayCand = subParts[0];
        let timeCand = subParts[1];
        let locCand = '';

        if (dayCand.endsWith(':')) {
          locCand = dayCand.slice(0, -1);
          dayCand = subParts[1] || '';
          timeCand = subParts.slice(2).join(' ') || '';
        }

        const dayLower = dayCand.toLowerCase().replace(/[^а-яa-z]/g, '');
        const day = DAY_MAP[dayLower];
        if (day) {
          const raw = locCand ? `${locCand}: ${day} ${timeCand}` : `${day} ${timeCand}`;
          results.push({
            day,
            time: timeCand,
            location: locCand || undefined,
            raw
          });
        }
      } else if (subParts.length === 1) {
        // Just day, e.g. "Пн"
        const dayLower = subParts[0].toLowerCase().replace(/[^а-яa-z]/g, '');
        const day = DAY_MAP[dayLower];
        if (day) {
          results.push({
            day,
            time: '',
            raw: day
          });
        }
      }
    }
  }

  // Deduplicate before returning
  const seen = new Set<string>();
  const uniqueResults: ParsedScheduleSlot[] = [];
  for (const r of results) {
    const key = `${r.day}_${r.time}_${r.location || ''}`.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      uniqueResults.push(r);
    }
  }

  return uniqueResults;
}

/**
 * Checks for genuine time collisions between a new schedule and existing groups for a coach.
 * Returns an array of detailed conflicts if intervals overlap on the same weekday.
 */
export function findCoachScheduleConflicts(
  allGroups: Array<{
    id: string;
    name: string;
    coachId: string;
    coachName?: string;
    scheduleDays?: string[];
  }>,
  coachId: string,
  newScheduleDays: string[],
  excludeGroupId?: string,
  newGroupName?: string
): ScheduleConflictDetail[] {
  if (!coachId || !newScheduleDays || newScheduleDays.length === 0) {
    return [];
  }

  // 1. Parse slots for the new group
  const newSlots: Array<{ day: string; timeStr: string; start: number; end: number }> = [];
  for (const item of newScheduleDays) {
    const parsed = parseScheduleString(item);
    if (parsed.length > 0) {
      for (const p of parsed) {
        const tr = parseTimeRangeMinutes(p.time);
        if (tr) {
          newSlots.push({ day: p.day, timeStr: p.time, start: tr.start, end: tr.end });
        }
      }
    } else {
      // Fallback
      const tr = parseTimeRangeMinutes(item);
      if (tr) {
        newSlots.push({ day: "Пн", timeStr: item, start: tr.start, end: tr.end });
      }
    }
  }

  if (newSlots.length === 0) {
    return [];
  }

  const conflicts: ScheduleConflictDetail[] = [];

  // 2. Iterate through other groups of the SAME coach
  for (const group of allGroups) {
    if (group.id === excludeGroupId) continue;
    if (group.coachId !== coachId) continue;
    // Don't compare with exact duplicate name if updating or re-submitting
    if (newGroupName && group.name === newGroupName && !excludeGroupId) continue;

    for (const rawSlot of group.scheduleDays || []) {
      const parsedExisting = parseScheduleString(rawSlot);
      for (const ex of parsedExisting) {
        const exRange = parseTimeRangeMinutes(ex.time);
        if (!exRange) continue;

        // Check each new slot against this existing slot
        for (const ns of newSlots) {
          if (ns.day === ex.day) {
            // Strict overlap formula: max(start1, start2) < min(end1, end2)
            const overlapStart = Math.max(ns.start, exRange.start);
            const overlapEnd = Math.min(ns.end, exRange.end);

            if (overlapStart < overlapEnd) {
              const startH = Math.floor(overlapStart / 60);
              const startM = String(overlapStart % 60).padStart(2, "0");
              const endH = Math.floor(overlapEnd / 60);
              const endM = String(overlapEnd % 60).padStart(2, "0");

              conflicts.push({
                day: ns.day,
                conflictingGroupName: group.name,
                conflictingTime: ex.time,
                newTime: ns.timeStr,
                overlapDescription: `${ns.day}: новое занятие (${ns.timeStr}) пересекается с группой «${group.name}» (${ex.time}) в интервале ${startH}:${startM}-${endH}:${endM}`,
              });
            }
          }
        }
      }
    }
  }

  return conflicts;
}

