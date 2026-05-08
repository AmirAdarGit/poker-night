import { useState } from 'react';
import styles from './PlayingPhase.module.scss';
import type { Player } from '../../types';
import { totalPot, DEFAULT_BUY_IN } from '../../types';
import type { Action } from '../../reducer/gameReducer';
import { PlayerCard } from '../PlayerCard/PlayerCard';

interface Props {
  players: Player[];
  dispatch: (a: Action) => void;
  onGoToSettlement: () => void;
  onRequestNewGame: () => void;
}

export function PlayingPhase({
  players,
  dispatch,
  onGoToSettlement,
  onRequestNewGame,
}: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [buyIn, setBuyIn] = useState(String(DEFAULT_BUY_IN));

  const pot = totalPot(players);
  const cashedOutCount = players.filter((p) => p.cashedOut !== null).length;
  const activeCount = players.length - cashedOutCount;
  const canSettle = cashedOutCount > 0;

  const sorted = [...players].sort((a, b) => {
    if (a.cashedOut !== null && b.cashedOut === null) return 1;
    if (a.cashedOut === null && b.cashedOut !== null) return -1;
    return a.joinedAt - b.joinedAt;
  });

  const handleAdd = () => {
    if (!name.trim()) return;
    const amount = Number(buyIn) || DEFAULT_BUY_IN;
    dispatch({ type: 'add-player', name, initialBuyIn: amount });
    setName('');
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

      <div className={styles.players}>
        {sorted.map((p) => (
          <PlayerCard key={p.id} player={p} dispatch={dispatch} />
        ))}
      </div>

      {showAdd ? (
        <div className={styles.addForm}>
          <input
            type="text"
            className={styles.nameInput}
            placeholder="שם השחקן"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd();
              }
            }}
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
            type="button"
            className={styles.confirmAdd}
            onClick={handleAdd}
            disabled={!name.trim()}
          >
            הוסף
          </button>
          <button
            type="button"
            className={styles.cancelAdd}
            onClick={() => {
              setShowAdd(false);
              setName('');
            }}
            aria-label="ביטול"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          type="button"
          className={styles.addPlayerButton}
          onClick={() => setShowAdd(true)}
        >
          + הוספת שחקן באמצע המשחק
        </button>
      )}

      <div className={styles.footer}>
        <button
          type="button"
          className={styles.settleButton}
          onClick={onGoToSettlement}
          disabled={!canSettle}
        >
          סיום וחישוב חובות
        </button>
        <button
          type="button"
          className={styles.newGameButton}
          onClick={onRequestNewGame}
        >
          משחק חדש
        </button>
      </div>
    </section>
  );
}
