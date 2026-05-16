// =============================================================================
// phoneBook — remembers players' phone numbers across games on this device, so
// the same weekly crew doesn't have to re-enter numbers every settlement.
// Keyed by lower-cased name; a best-effort convenience, not a source of truth.
// =============================================================================

const KEY = 'poker-night:phonebook';

type Book = Record<string, string>;

function read(): Book {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as Book) : {};
  } catch {
    return {};
  }
}

export function getRememberedPhone(name: string): string | null {
  const v = read()[name.trim().toLowerCase()];
  return v || null;
}

export function rememberPhone(name: string, phone: string): void {
  const key = name.trim().toLowerCase();
  if (!key) return;
  try {
    const book = read();
    book[key] = phone.trim();
    localStorage.setItem(KEY, JSON.stringify(book));
  } catch {
    // Quota / privacy mode — ignore.
  }
}
