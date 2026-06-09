import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './PlayingPhase.module.scss';
import type { Player } from '../../types';
import { totalPot, DEFAULT_BUY_IN } from '../../types';
import type { Action } from '../../reducer/gameReducer';
import { PlayerCard } from '../PlayerCard/PlayerCard';
import { useRoster } from '../../hooks/useRoster';
import { useGroup } from '../../contexts/GroupContext';

interface Props {
  players: Player[];
  dispatch: (a: Action) => void;
  onGoToSettlement: () => void;
  onCloseGame: () => void;
  onRequestNewGame: () => void;
}

export function PlayingPhase({
  players,
  dispatch,
  onGoToSettlement,
  onCloseGame,
  onRequestNewGame,
}: Props) {
  const { t } = useTranslation();
  const { activeGroupId } = useGroup();
  const { roster, add } = useRoster(activeGroupId);
  const [showAdd, setShowAdd] = useState(false);
  const [buyIn, setBuyIn] = useState(String(DEFAULT_BUY_IN));
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  const pot = totalPot(players);
  const cashedOutCount = players.filter((p) => p.cashedOut !== null).length;
  const activeCount = players.length - cashedOutCount;
  const canSettle = cashedOutCount > 0;

  const available = useMemo(
    () => roster.filter((r) => !players.some((p) => p.rosterId === r.id)),
    [roster, players],
  );

  const sorted = [...players].sort((a, b) => {
    if (a.cashedOut !== null && b.cashedOut === null) return 1;
    if (a.cashedOut === null && b.cashedOut !== null) return -1;
    return a.joinedAt - b.joinedAt;
  });

  const buyInValue = () => Math.max(0, Number(buyIn) || DEFAULT_BUY_IN);

  const addExisting = (rosterId: string, name: string) => {
    dispatch({ type: 'add-player', rosterId, name, initialBuyIn: buyInValue() });
    setShowAdd(false);
    setBuyIn(String(DEFAULT_BUY_IN));
  };

  const handleAddNew = async () => {
    const name = newName.trim();
    if (!name || adding) return;
    setAdding(true);
    const created = await add(name);
    setAdding(false);
    if (!created) return;
    setNewName('');
    addExisting(created.id, created.name);
  };

  return (
    <section className={styles.phase}>
      <div className={styles.statsBar}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{pot} {t('common.currency')}</span>
          <span className={styles.statLabel}>{t('playing.pot')}</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <span className={styles.statValue}>{activeCount}</span>
          <span className={styles.statLabel}>{t('playing.inGame')}</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <span className={styles.statValue}>{cashedOutCount}</span>
          <span className={styles.statLabel}>{t('playing.cashedOut')}</span>
        </div>
      </div>

      <div className={styles.players}>
        {sorted.map((p) => (
          <PlayerCard key={p.id} player={p} dispatch={dispatch} />
        ))}
      </div>

      {showAdd ? (
        <div className={styles.addForm}>
          <label className={styles.addRow}>
            <span className={styles.addLabel}>{t('playing.buyInAmount')}</span>
            <input
              type="number"
              inputMode="numeric"
              className={styles.amountInput}
              value={buyIn}
              onChange={(e) => setBuyIn(e.target.value)}
              min={0}
              step={10}
              aria-label={t('playing.buyInAmountLabel')}
            />
            <span className={styles.currency}>{t('common.currency')}</span>
            <button
              type="button"
              className={styles.cancelAdd}
              onClick={() => setShowAdd(false)}
              aria-label={t('common.cancel')}
            >
              ✕
            </button>
          </label>

          {available.length > 0 && (
            <div className={styles.chips}>
              {available.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={styles.chip}
                  onClick={() => addExisting(r.id, r.name)}
                >
                  {r.name}
                </button>
              ))}
            </div>
          )}

          <div className={styles.addNew}>
            <input
              type="text"
              className={styles.nameInput}
              placeholder={t('playing.newPlayerPlaceholder')}
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
              className={styles.confirmAdd}
              onClick={() => void handleAddNew()}
              disabled={!newName.trim() || adding}
            >
              {t('playing.add')}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className={styles.addPlayerButton}
          onClick={() => setShowAdd(true)}
        >
          {t('playing.addPlayerMidGame')}
        </button>
      )}

      <div className={styles.footer}>
        <button
          type="button"
          className={styles.settleButton}
          onClick={onGoToSettlement}
          disabled={!canSettle}
        >
          {t('playing.settle')}
        </button>
        <div className={styles.footerRow}>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onCloseGame}
          >
            {t('playing.closeGame')}
          </button>
          <button
            type="button"
            className={styles.newGameButton}
            onClick={onRequestNewGame}
          >
            {t('playing.newGame')}
          </button>
        </div>
      </div>
    </section>
  );
}
