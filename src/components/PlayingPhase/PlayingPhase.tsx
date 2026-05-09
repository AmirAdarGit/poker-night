import { useState } from 'react';
import styles from './PlayingPhase.module.scss';
import type { Player } from '../../types';
import { totalPot, DEFAULT_BUY_IN } from '../../types';
import type { Action } from '../../reducer/gameReducer';
import { PlayerCard } from '../PlayerCard/PlayerCard';
import { lookupProfileByEmail } from '../../lib/players';

interface Props {
  players: Player[];
  dispatch: (a: Action) => void;
  onGoToSettlement: () => void;
  onRequestNewGame: () => void;
  isHost: boolean;
}

export function PlayingPhase({
  players,
  dispatch,
  onGoToSettlement,
  onRequestNewGame,
  isHost,
}: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [email, setEmail] = useState('');
  const [buyIn, setBuyIn] = useState(String(DEFAULT_BUY_IN));
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const pot = totalPot(players);
  const cashedOutCount = players.filter((p) => p.cashedOut !== null).length;
  const activeCount = players.length - cashedOutCount;
  const canSettle = cashedOutCount > 0;

  const sorted = [...players].sort((a, b) => {
    if (a.cashedOut !== null && b.cashedOut === null) return 1;
    if (a.cashedOut === null && b.cashedOut !== null) return -1;
    return a.joinedAt - b.joinedAt;
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    if (!email.trim()) return;
    setLookingUp(true);
    const found = await lookupProfileByEmail(email);
    setLookingUp(false);
    if (!found) {
      setLookupError('לא נמצא משתמש עם המייל הזה');
      return;
    }
    if (players.some((p) => p.id === found.id)) {
      setLookupError('השחקן כבר במשחק');
      return;
    }
    const amount = Number(buyIn) || DEFAULT_BUY_IN;
    dispatch({
      type: 'add-player',
      userId: found.id,
      name: found.display_name,
      initialBuyIn: amount,
    });
    setEmail('');
    setBuyIn(String(DEFAULT_BUY_IN));
    setShowAdd(false);
  };

  return (
    <section className={styles.phase}>
      <div className={styles.statsBar}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{pot} ₪</span>
          <span className={styles.statLabel}>קופה</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <span className={styles.statValue}>{activeCount}</span>
          <span className={styles.statLabel}>במשחק</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <span className={styles.statValue}>{cashedOutCount}</span>
          <span className={styles.statLabel}>יצאו</span>
        </div>
      </div>

      {!isHost && (
        <div className={styles.viewerBanner}>
          אתה צופה במשחק בזמן אמת. רק המארח יכול לעדכן.
        </div>
      )}

      <div className={styles.players}>
        {sorted.map((p) => (
          <PlayerCard
            key={p.id}
            player={p}
            dispatch={dispatch}
            canEdit={isHost}
          />
        ))}
      </div>

      {isHost &&
        (showAdd ? (
          <form className={styles.addForm} onSubmit={handleAdd}>
            <input
              type="email"
              className={styles.nameInput}
              placeholder="אימייל של שחקן רשום"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
            <input
              type="number"
              inputMode="numeric"
              className={styles.amountInput}
              value={buyIn}
              onChange={(e) => setBuyIn(e.target.value)}
              min={0}
              step={10}
              aria-label="סכום כניסה"
            />
            <button
              type="submit"
              className={styles.confirmAdd}
              disabled={!email.trim() || lookingUp}
            >
              {lookingUp ? '…' : 'הוסף'}
            </button>
            <button
              type="button"
              className={styles.cancelAdd}
              onClick={() => {
                setShowAdd(false);
                setEmail('');
                setLookupError(null);
              }}
              aria-label="ביטול"
            >
              ✕
            </button>
          </form>
        ) : (
          <button
            type="button"
            className={styles.addPlayerButton}
            onClick={() => setShowAdd(true)}
          >
            + הוספת שחקן באמצע המשחק
          </button>
        ))}

      {lookupError && <div className={styles.lookupError}>{lookupError}</div>}

      <div className={styles.footer}>
        {isHost && (
          <button
            type="button"
            className={styles.settleButton}
            onClick={onGoToSettlement}
            disabled={!canSettle}
          >
            סיום וחישוב חובות
          </button>
        )}
        <button
          type="button"
          className={styles.newGameButton}
          onClick={onRequestNewGame}
        >
          {isHost ? 'משחק חדש' : 'יציאה מהצפייה'}
        </button>
      </div>
    </section>
  );
}
