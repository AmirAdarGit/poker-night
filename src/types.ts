export interface Player {
  // Equals auth.users.id (uuid). Players are always registered users.
  id: string;
  // Snapshotted from profiles.display_name when the player was added,
  // so renaming yourself later doesn't rewrite past games.
  name: string;
  buyIns: number[];
  cashedOut: number | null;
  joinedAt: number;
  // Optional Israeli mobile number. Entered on the settlement screen and used
  // for WhatsApp reminders and Bit payments — never required to play.
  phone?: string;
}

export interface Profile {
  id: string;
  display_name: string;
  email: string | null;
  created_at?: string;
}

export type Phase = 'setup' | 'playing' | 'settlement';

export interface GameState {
  phase: Phase;
  players: Player[];
}

export interface Settlement {
  from: string;
  to: string;
  // Player IDs behind the names — names can collide, IDs map back to a player.
  fromId: string;
  toId: string;
  amount: number;
}

export const DEFAULT_BUY_IN = 50;

export function createEmptyState(): GameState {
  return { phase: 'setup', players: [] };
}

export function sumBuyIns(p: Player): number {
  return p.buyIns.reduce((s, b) => s + b, 0);
}

export function getNet(p: Player): number {
  return p.cashedOut == null ? 0 : p.cashedOut - sumBuyIns(p);
}

export function totalPot(players: Player[]): number {
  return players.reduce((s, p) => s + sumBuyIns(p), 0);
}

export function totalCashedOut(players: Player[]): number {
  return players.reduce((s, p) => s + (p.cashedOut ?? 0), 0);
}
