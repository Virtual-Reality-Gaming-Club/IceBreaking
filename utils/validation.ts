/**
 * Normalize and validate Full Name.
 * - Trims whitespace
 * - Collapses repeated spaces
 */
export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export function isValidName(name: string): boolean {
  const normalized = normalizeName(name);
  if (normalized.length < 2 || normalized.length > 100) return false;
  // Allow letters, spaces, hyphens, periods, and apostrophes
  const nameRegex = /^[a-zA-Z\s\-'.]+$/;
  return nameRegex.test(normalized);
}

/**
 * Normalize and validate Registration Number.
 * - Trims whitespace
 * - Converts to uppercase
 */
export function normalizeRegNumber(regNum: string): string {
  return regNum.trim().toUpperCase();
}

export function isValidRegNumber(regNum: string): boolean {
  const normalized = normalizeRegNumber(regNum);
  // 2 digits + 3 uppercase letters + 5 digits
  const regRegex = /^[0-9]{2}[A-Z]{3}[0-9]{5}$/;
  return regRegex.test(normalized);
}
