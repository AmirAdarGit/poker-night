import { useMemo, useState } from 'react';
import styles from './SetupPhase.module.scss';
import type { Player } from '../../types';
import { DEFAULT_BUY_IN } from '../../types';
import type { Action } from '../../reducer/gameReducer';
import { useAuth } from '../../contexts/AuthContext';
import { useRoster } from '../../hooks/useRoster';

interface Props {
  groupId: string | null;
  players: Player[];
  dispatch: (a: Action) => void;
  onStartGame: () => void;
}

export function SetupPhase({ groupId, players, dispatch, onStartGame }: Props) {
  const { profile } = useAuth();
  const { roster, loading, add, rename, remove } = useRoster(groupId);
  const [defaultBuyIn, setDefaultBuyIn] = useState<string>(
    String(DEFAULT_BUY_IN),
  );
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [editError, setEditError] = useState<string | null>(null);

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

  const handleRename = async (id: string, fallback: string) => {
    const value = (edits[id] ?? fallback).trim();
    setEditError(null);
    if (!value || value === fallback) {
      setEdits((m) => {
        const { [id]: _drop, ...rest } = m;
        return rest;
      });
      return;
    }
    const updated = await rename(id, value);
    if (!updated) {
      setEditError(`לא ניתן לשנות ל"${value}" — ייתכן שהשם כבר קיים`);
      return;
    }
    // Keep an already-selected player's name in step with the roster rename.
    if (byRoster.has(id)) {
      dispatch({ type: 'set-player-name', id, name: updated.name });
    }
    setEdits((m) => {
      const { [id]: _drop, ...rest } = m;
      return rest;
    });
  };

  const handleDelete = async (id: string) => {
    setEditError(null);
    const ok = await remove(id);
    if (!ok) {
      setEditError('מחיקה נכשלה');
      return;
    }
    if (byRoster.has(id)) dispatch({ type: 'remove-player', id });
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

      {roster.length > 0 && (
        <div className={styles.rosterHeader}>
          <span className={styles.rosterHint}>
            {editMode ? 'ערכו שמות או מחקו שחקנים' : 'בחרו שחקנים מהרשימה'}
          </span>
          <button
            type="button"
            className={styles.editToggle}
            onClick={() => {
              setEditMode((v) => !v);
              setEditError(null);
              setEdits({});
            }}
          >
            {editMode ? 'סיום' : '✎ עריכת שמות'}
          </button>
        </div>
      )}

      {editError && <div className={styles.editError}>{editError}</div>}

      {loading ? (
        <div className={styles.empty}>טוען שחקנים…</div>
      ) : roster.length === 0 ? (
        <div className={styles.empty}>
          עדיין אין שחקנים בקבוצה — הוסיפו את הראשון למטה.
        </div>
      ) : editMode ? (
        <ul className={styles.editList}>
          {roster.map((r) => (
            <li key={r.id} className={styles.editRow}>
              <input
                type="text"
                className={styles.editInput}
                value={edits[r.id] ?? r.name}
                onChange={(e) =>
                  setEdits((m) => ({ ...m, [r.id]: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void handleRename(r.id, r.name);
                  }
                }}
                aria-label={`שם השחקן ${r.name}`}
              />
              <button
                type="button"
                className={styles.saveButton}
                onClick={() => void handleRename(r.id, r.name)}
                disabled={(edits[r.id] ?? r.name).trim() === r.name}
                aria-label={`שמור את ${r.name}`}
              >
                ✓
              </button>
              <button
                type="button"
                className={styles.removeButton}
                onClick={() => void handleDelete(r.id)}
                aria-label={`מחק את ${r.name}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
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
