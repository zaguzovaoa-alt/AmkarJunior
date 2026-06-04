export function calculateAge(birthDate: string | undefined, birthYear: number): number {
  if (birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }
  return new Date().getFullYear() - birthYear;
}

export function isBirthdayToday(birthDate: string | undefined): boolean {
  if (!birthDate) return false;
  const today = new Date();
  const birth = new Date(birthDate);
  return today.getDate() === birth.getDate() && today.getMonth() === birth.getMonth();
}
