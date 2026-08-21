/**
 * Formats a group name cleanly, evenly and without awkward irregular spaces.
 * e.g. "Баумана 27( 2014-2017)" -> "Баумана 27 (2014-2017)"
 */
export function formatGroupNameDisplay(name?: string | null): string {
  if (!name) return "";
  let clean = name.trim();
  // Normalize multiple spaces
  clean = clean.replace(/\s+/g, " ");
  // Ensure single space before opening parenthesis if preceded by character/number
  clean = clean.replace(/([^\s(])\(/g, "$1 (");
  // Remove space right after opening parenthesis
  clean = clean.replace(/\(\s+/g, "(");
  // Remove space right before closing parenthesis
  clean = clean.replace(/\s+\)/g, ")");
  // Standardize year range hyphens e.g. "2014 - 2017" -> "2014-2017"
  clean = clean.replace(/(\d{4})\s*[-–—]\s*(\d{4})/g, "$1-$2");
  return clean.trim();
}
