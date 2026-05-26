export interface ParsedScheduleSlot {
  day: string; // e.g. "Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"
  time: string; // e.g. "18:00" or "18:00 - 19:00"
  location?: string; // e.g. "Зал", "Поле", "Манеж"
  raw: string; // e.g. "Зал: Вт 18:00 - 19:00"
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

export function parseScheduleString(input: string): ParsedScheduleSlot[] {
  if (!input) return [];

  const results: ParsedScheduleSlot[] = [];
  
  // Case-insensitive regex to capture Optional Location: Weekday Time(range)
  // Group 1: Optional Location (any words followed by a colon)
  // Group 2: Weekday name
  // Group 3: Time or range, supporting - or dash and decimals, e.g. 18:00 - 19:00 or 17:30
  const regex = /(?:([А-Яа-яA-Za-z0-9\s№№_\-#().,]+):\s*)?(понедельник|вторник|среда|четверг|пятница|суббота|воскресенье|пн|вт|ср|чт|пт|сб|вс|mon|tue|wed|thu|fri|sat|sun)\s+(\d{1,2}[:.]\d{2}(?:\s*-\s*\d{1,2}[:.]\d{2})?)/gi;

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
