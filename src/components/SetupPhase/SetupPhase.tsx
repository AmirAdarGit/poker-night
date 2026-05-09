import { useEffect, useMemo, useState } from 'react';
import styles from './SetupPhase.module.scss';
import type { Player, Profile } from '../../types';
import { DEFAULT_BUY_IN } from '../../types';
import type { Action } from '../../reducer/gameReducer';
import { useAuth } from '../../contexts/AuthContext';
import {
  fetchRecentCoPlayers,
  lookupProfileByEmail,
} from '../../lib/players';

interface Props {
  players: Player[];
  dispatch: (a: Action) => void;
  onStartGame: () => void;
}

export function SetupPhase({ players, dispatch, onStartGame }: Props) {
  const { user, profile } = useAuth();
  const [recent, setRecent] = useState<Profile[]>([]);
  const [email, setEmail] = useState('');
  const [buyIn, setBuyIn] = useState(String(DEFAULT_BUY_IN));
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookingUp, setLookingUp] = useState(false);

  // Auto-add the host as the first player.
  useEffect(() => {
    if (!user || !profile) return;
    if (players.some((p) => p.id === user.id)) return;
    dispatch({
      type: 'add-player',
      userId: user.id,
      name: profile.display_name,
      initialBuyIn: DEFAULT_BUY_IN,
    });
  }, [user, profile, players, dispatch]);

  // Load recently-played-with users.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetchRecentCoPlayers(user.id).then((rows) => {
      if (!cancelled) setRecent(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const presentIds = useMemo(
    () => new Set(players.map((p) => p.id)),
    [players],
  );
  const availableRecent = recent.filter((p) => !presentIds.has(p.id));

  const addProfile = (p: Profile) => {
    const amount = Number(buyIn) || DEFAULT_BUY_IN;
    dispatch({
      type: 'add-player',
      userId: p.id,
      name: p.display_name,
      initialBuyIn: amount,
    });
  };

  const handleEmailLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    if (!email.trim()) return;
    setLookingUp(true);
    const found = await lookupProfileByEmail(email);
    setLookingUp(false);
    if (!found) {
      setLookupError(
        `לא נמצא משתמש עם המייל הזה. בקשו מהשחקן להירשם תחילה.`,
      );
      return;
    }
    if (presentIds.has(found.id)) {
      setLookupError('השחקן כבר במשחק');
      return;
    }
    addProfile(found);
    setEmail('');
  };

  const canStart = players.length >= 2;

  return (
    <section className={styles.setup}>
      <div className={styles.intro}>
        <h2 className={styles.heading}>מי משחק?</h2>
        <p className={styles.subheading}>
          הוסיפו שחקנים רשומים. ברירת המחדל לכניסה היא {DEFAULT_BUY_IN} ₪.
        </p>
      </div>

      <div className={styles.controls}>
        <label className={styles.amountLabel}>
          סכום כניסה ברירת מחדל
          <input
            type="number"
            inputMode="numeric"
            className={styles.amountInput}
            value={buyIn}
            onChange={(e) => setBuyIn(e.target.value)}
            min={0}
            step={10}
          />
        </label>
      </div>

      {availableRecent.length > 0 && (
        <div className={styles.recent}>
          <div className={styles.recentLabel}>שחקנים שאיתם שיחקת</div>
          <div className={styles.recentChips}>
            {availableRecent.map((p) => (
              <button
                key={p.id}
                type="button"
                className={styles.chip}
                onClick={() => addProfile(p)}
              >
                + {p.display_name}
              </button>
            ))}
          </div>
        </div>
      )}

      <form className={styles.emailForm} onSubmit={handleEmailLookup}>
        <input
          type="email"
          className={styles.emailInput}
          placeholder="הוסף שחקן לפי אימייל"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="off"
        />
        <button
          type="submit"
          className={styles.lookupButton}
          disabled={!email.trim() || lookingUp}
        >
          {lookingUp ? '…' : 'הוסף'}
        </button>
      </form>
      {lookupError && <div className={styles.lookupError}>{lookupError}</div>}

      {players.length > 0 ? (
        <ul className={styles.list}>
          {players.map((p) => (
            <li key={p.id} className={styles.listItem}>
              <span className={styles.playerName}>
                {p.name}
                {p.id === user?.id && (
                  <span className={styles.youBadge}>אתה</span>
                )}
              </span>
              <span className={styles.playerBuyIn}>{p.buyIns[0]} ₪</span>
              {p.id !== user?.id && (
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() => dispatch({ type: 'remove-player', id: p.id })}
                  aria-label={`הסר את ${p.name}`}
                >
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className={styles.empty}>אין שחקנים עדיין</div>
      )}

      <div className={styles.footer}>
        <div className={styles.summary}>
          {players.length} שחקנים · קופה התחלתית{' '}
          {players.reduce((s, p) => s + (p.buyIns[0] ?? 0), 0)} ₪
        </div>
        <button
          type="button"
          className={styles.startButton}
          onClick={onStartGame}
          disabled={!canStart}
        >
          התחל משחק
        </button>
      </div>
    </section>
  );
}
