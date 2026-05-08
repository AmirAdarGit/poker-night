const ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz';

export function generateGameId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}

export function isValidGameId(id: string): boolean {
  if (id.length < 4 || id.length > 16) return false;
  for (const ch of id) {
    if (!ALPHABET.includes(ch)) return false;
  }
  return true;
}

export function generatePlayerId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
