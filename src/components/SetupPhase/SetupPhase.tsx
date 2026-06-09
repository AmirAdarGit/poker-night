import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      setEditError(t('setup.renameFailed', { value }));
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
      setEditError(t('setup.deleteFailed'));
      return;
    }
    if (byRoster.has(id)) dispatch({ type: 'remove-player', id });
  };

  const initialPot = players.reduce((s, p) => s + (p.buyIns[0] ?? 0), 0);

  return (
    <section className={styles.setup}>
      <div className={styles.intro}>
        <h2 className={styles.heading}>{t('setup.heading')}</h2>
        <p className={styles.subheading}>{t('setup.subheading')}</p>
      </div>

      <label className={styles.defaultRow}>
        <span className={styles.defaultLabel}>{t('setup.defaultBuyIn')}</span>
        <input
          type="number"
          inputMode="numeric"
          className={styles.defaultInput}
          value={defaultBuyIn}
          onChange={(e) => setDefaultBuyIn(e.target.value)}
          min={0}
          step={10}
          aria-label={t('setup.defaultBuyIn')}
        />
        <span className={styles.currency}>{t('common.currency')}</span>
      </label>

      {roster.length > 0 && (
        <div className={styles.rosterHeader}>
          <span className={styles.rosterHint}>
            {editMode ? t('setup.editHint') : t('setup.selectHint')}
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
            {editMode ? t('setup.done') : t('setup.editNames')}
          </button>
        </div>
      )}

      {editError && <div className={styles.editError}>{editError}</div>}

      {loading ? (
        <div className={styles.empty}>{t('setup.loadingPlayers')}</div>
      ) : roster.length === 0 ? (
        <div className={styles.empty}>{t('setup.noPlayers')}</div>
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
                aria-label={t('setup.playerNameLabel', { name: r.name })}
              />
              <button
                type="button"
                className={styles.saveButton}
                onClick={() => void handleRename(r.id, r.name)}
                disabled={(edits[r.id] ?? r.name).trim() === r.name}
                aria-label={t('setup.savePlayer', { name: r.name })}
              >
                ✓
              </button>
              <button
                type="button"
                className={styles.removeButton}
                onClick={() => void handleDelete(r.id)}
                aria-label={t('setup.deletePlayer', { name: r.name })}
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
                {isYou && <span className={styles.youBadge}>{t('setup.you')}</span>}
              </button>
            );
          })}
        </div>
      )}

      <div className={styles.addNew}>
        <input
          type="text"
          className={styles.addNewInput}
          placeholder={t('setup.addNewPlaceholder')}
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
          {t('setup.add')}
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
                  aria-label={t('setup.buyInOf', { name: p.name })}
                />
                <span className={styles.currency}>{t('common.currency')}</span>
              </div>
              <button
                type="button"
                className={styles.removeButton}
                onClick={() => dispatch({ type: 'remove-player', id: p.id })}
                aria-label={t('setup.removePlayer', { name: p.name })}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className={styles.footer}>
        <div className={styles.summary}>
          {t('setup.summary', { count: players.length, pot: initialPot })}
        </div>
        <button
          type="button"
          className={styles.startButton}
          onClick={onStartGame}
          disabled={!canStart}
        >
          {t('setup.startGame')}
        </button>
      </div>
    </section>
  );
}
