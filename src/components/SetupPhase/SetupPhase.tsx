import { useMemo, useState } from 'react';
import styles from './SetupPhase.module.scss';
import type { Player } from '../../types';
import { DEFAULT_BUY_IN } from '../../types';
import type { Action } from '../../reducer/gameReducer';
import { useAuth } from '../../contexts/AuthContext';
import { useRoster } from '../../hooks/useRoster';

interface Props {
  players: Player[];
  dispatch: (a: Action) => void;
  onStartGame: () => void;
}

export function SetupPhase({ players, dispatch, onStartGame }: Props) {
  const { profile } = useAuth();
  const { roster, loading, add } = useRoster();
  const [defaultBuyIn, setDefaultBuyIn] = useState<string>(
    String(DEFAULT_BUY_IN),
  );
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  // rosterId -> in-game player, for O(1) selected lookups and buy-in edits.
  const byRoster = useMemo(() => {
    const m = new Map<string, Player>();
    for (const p of players) if (p.rosterId) m.set(p.rosterId, p);
    return m;
  }, [players]);

  const canStart = players.length >= 2;
  const buyInValue = () => Math.max(0, Number(defaultBuyIn) || DEFAULT_BUY_IN);

  const toggle = (id: string, name: string) => {
    const existing = byRoster.get(id);
    if (existing) {
      dispatch({ type: 'remove-player', id: existing.id });
    } else {
      dispatch({
        type: 'add-player',
        rosterId: id,
        name,
        initialBuyIn: buyInValue(),
      });
    }
  };

  const handleAddNew = async () => {
    const name = newName.trim();
    if (!name || adding) return;
    setAdding(true);
    const created = await add(name);
    setAdding(false);
    if (!created) return;
    setNewName('');
    dispatch({
      type: 'add-player',
      rosterId: created.id,
      name: created.name,
      initialBuyIn: buyInValue(),
    });
  };

  const initialPot = players.reduce((s, p) => s + (p.buyIns[0] ?? 0), 0);

  return (
    <section className={styles.setup}>
      <div className={styles.intro}>
        <h2 className={styles.heading}>מי משחק?</h2>
        <p className={styles.subheading}>
          בחרו שחקנים מהרשימה. אפשר לשנות את סכום הכניסה לכל אחד.
        </p>
      </div>

      <label className={styles.defaultRow}>
        <span className={styles.defaultLabel}>סכום כניסה ברירת מחדל</span>
        <input
          type="number"
          inputMode="numeric"
          className={styles.defaultInput}
          value={defaultBuyIn}
          onChange={(e) => setDefaultBuyIn(e.target.value)}
          min={0}
          step={10}
          aria-label="סכום כניסה ברירת מחדל"
        />
        <span className={styles.currency}>₪</span>
      </label>

      {loading ? (
        <div className={styles.empty}>טוען שחקנים…</div>
      ) : (
        <div className={styles.chips}>
          {roster.map((r) => {
            const selected = byRoster.has(r.id);
            const isYou = profile?.display_name === r.name;
            return (
              <button
                key={r.id}
                type="button"
                className={`${styles.chip} ${selected ? styles.chipOn : ''}`}
                onClick={() => toggle(r.id, r.name)}
                aria-pressed={selected}
              >
                {r.name}
                {isYou && <span className={styles.youBadge}>אתה</span>}
              </button>
            );
          })}
        </div>
      )}

      <div className={styles.addNew}>
        <input
          type="text"
          className={styles.addNewInput}
          placeholder="הוסף שחקן חדש לרשימה"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void handleAddNew();
            }
          }}
        />
        <button
          type="button"
          className={styles.addNewButton}
          onClick={() => void handleAddNew()}
          disabled={!newName.trim() || adding}
        >
          הוסף
        </button>
      </div>

      {players.length > 0 && (
        <ul className={styles.list}>
          {players.map((p) => (
            <li key={p.id} className={styles.listItem}>
              <span className={styles.playerName}>{p.name}</span>
              <div className={styles.buyInEdit}>
                <input
                  type="number"
                  inputMode="numeric"
                  className={styles.buyInInput}
                  value={p.buyIns[0] ?? 0}
                  onChange={(e) =>
                    dispatch({
                      type: 'set-initial-buy-in',
                      id: p.id,
                      amount: Number(e.target.value) || 0,
                    })
                  }
                  min={0}
                  step={10}
                  aria-label={`סכום כניסה של ${p.name}`}
                />
                <span className={styles.currency}>₪</span>
              </div>
              <button
                type="button"
                className={styles.removeButton}
                onClick={() => dispatch({ type: 'remove-player', id: p.id })}
                aria-label={`הסר את ${p.name}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className={styles.footer}>
        <div className={styles.summary}>
          {players.length} שחקנים · קופה התחלתית {initialPot} ₪
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
