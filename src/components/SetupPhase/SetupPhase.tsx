import { useEffect, useState } from 'react';
import styles from './SetupPhase.module.scss';
import type { Player } from '../../types';
import { DEFAULT_BUY_IN } from '../../types';
import type { Action } from '../../reducer/gameReducer';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  players: Player[];
  dispatch: (a: Action) => void;
  onStartGame: () => void;
}

export function SetupPhase({ players, dispatch, onStartGame }: Props) {
  const { user, profile } = useAuth();
  const [name, setName] = useState('');
  const [buyIn, setBuyIn] = useState<string>(String(DEFAULT_BUY_IN));

  // Auto-add the host as the first player using their display name.
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

  const canAdd = name.trim().length > 0;
  const canStart = players.length >= 2;

  const handleAdd = () => {
    if (!canAdd) return;
    const amount = Number(buyIn) || DEFAULT_BUY_IN;
    dispatch({ type: 'add-player', name, initialBuyIn: amount });
    setName('');
    setBuyIn(String(DEFAULT_BUY_IN));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <section className={styles.setup}>
      <div className={styles.intro}>
        <h2 className={styles.heading}>מי משחק?</h2>
        <p className={styles.subheading}>
          הוסיפו את שמות השחקנים. ברירת המחדל לכניסה היא {DEFAULT_BUY_IN} ₪.
        </p>
      </div>

      <div className={styles.form}>
        <input
          type="text"
          inputMode="text"
          className={styles.nameInput}
          placeholder="שם השחקן"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        <input
          type="number"
          inputMode="numeric"
          className={styles.amountInput}
          value={buyIn}
          onChange={(e) => setBuyIn(e.target.value)}
          onKeyDown={handleKeyDown}
          min={0}
          step={10}
          aria-label="סכום כניסה"
        />
        <button
          type="button"
          className={styles.addButton}
          onClick={handleAdd}
          disabled={!canAdd}
        >
          הוסף
        </button>
      </div>

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
