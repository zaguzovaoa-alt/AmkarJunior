
function parseSafeDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  // If DD.MM.YYYY
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) {
    const [d, m, y] = dateStr.split(".");
    return new Date(Number(y), Number(m) - 1, Number(d));
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split("-");
    return new Date(Number(y), Number(m) - 1, Number(d));
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d;
}

export function parseSessionDate(dateStr?: string, dateISO?: string): Date {
  if (dateISO) {
    const d = new Date(dateISO);
    if (!isNaN(d.getTime())) return d;
  }
  if (dateStr) {
    const parsed = parseSafeDate(dateStr);
    if (parsed) return parsed;
  }
  return new Date();
}

export function toISODateString(dateStr?: string, dateISO?: string): string {
  const d = parseSessionDate(dateStr, dateISO);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function toYearMonthString(dateStr?: string, dateISO?: string): string {
  const d = parseSessionDate(dateStr, dateISO);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

export function calculateAge(birthDate: string | undefined, birthYear: number): number {
  if (birthDate) {
    const birth = parseSafeDate(birthDate);
    if (birth) {
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    }
  }
  return new Date().getFullYear() - birthYear;
}

export function isBirthdayToday(birthDate: string | undefined): boolean {
  if (!birthDate) return false;
  const birth = parseSafeDate(birthDate);
  if (!birth) return false;
  const today = new Date();
  return today.getDate() === birth.getDate() && today.getMonth() === birth.getMonth();
}
