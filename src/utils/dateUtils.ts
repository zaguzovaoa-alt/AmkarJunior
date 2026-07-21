
function parseSafeDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  // If DD.MM.YYYY
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) {
    const [d, m, y] = dateStr.split(".");
    return new Date(`${y}-${m}-${d}`);
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d;
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
