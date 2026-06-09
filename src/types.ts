export interface Player {
  // Unique within a single game. For roster players this equals rosterId, so a
  // given friend can only be added once per game. Free-text/legacy players get
  // a generated id instead.
  id: string;
  // Stable cross-game identity — references roster_players.id. Analytics
  // aggregate by this so renaming a player never splits their history. Absent
  // on legacy/free-text players (fall back to id + name there).
  rosterId?: string;
  // Snapshotted name when the player was added, so renaming them later
  // doesn't rewrite past games.
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
  // One-time Pro unlock — server-truth (only the activate-pro Edge Function can
  // set these). Absent on legacy rows; treat undefined as not-pro.
  is_pro?: boolean;
  pro_since?: string | null;
  // Admin flag — server-truth. Gates access to the admin dashboard.
  is_admin?: boolean;
  // BCP-47 locale captured at signup (e.g. 'he-IL'). Absent on legacy rows.
  locale?: string | null;
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

// Stable identity used to aggregate a player across games. Roster players key
// by rosterId; legacy free-text players fall back to their per-game id.
export function playerKey(p: Player): string {
  return p.rosterId ?? p.id;
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
