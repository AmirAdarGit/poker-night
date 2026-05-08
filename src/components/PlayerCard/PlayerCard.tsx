import { useState } from 'react';
import styles from './PlayerCard.module.scss';
import type { Player } from '../../types';
import { sumBuyIns, getNet, DEFAULT_BUY_IN } from '../../types';
import type { Action } from '../../reducer/gameReducer';

interface Props {
  player: Player;
  dispatch: (a: Action) => void;
}

export function PlayerCard({ player, dispatch }: Props) {
  const [rebuyAmount, setRebuyAmount] = useState<string>(
    String(DEFAULT_BUY_IN),
  );
  const [cashOutAmount, setCashOutAmount] = useState<string>('');
  const [showCashOut, setShowCashOut] = useState(false);

  const invested = sumBuyIns(player);
  const isCashedOut = player.cashedOut !== null;
  const net = getNet(player);

  const handleRebuy = () => {
    const amount = Number(rebuyAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    dispatch({ type: 'add-buy-in', id: player.id, amount });
    setRebuyAmount(String(DEFAULT_BUY_IN));
  };

  const handleCashOut = () => {
    const amount = Number(cashOutAmount);
    if (!Number.isFinite(amount) || amount < 0) return;
    dispatch({ type: 'cash-out', id: player.id, amount });
    setCashOutAmount('');
    setShowCashOut(false);
  };

  return (
    <article
      className={`${styles.card} ${isCashedOut ? styles.cardOut : ''}`}
    >
      <header className={styles.header}>
        <div className={styles.identity}>
          <h3 className={styles.name}>{player.name}</h3>
          <div className={styles.meta}>
            השקיע {invested} ₪ · {player.buyIns.length}{' '}
            {player.buyIns.length === 1 ? 'כניסה' : 'כניסות'}
          </div>
        </div>
        {isCashedOut ? (
          <div
            className={`${styles.netBadge} ${
              net >= 0 ? styles.netBadgePos : styles.netBadgeNeg
            }`}
          >
            {net >= 0 ? '+' : ''}
            {net} ₪
          </div>
        ) : (
          <div className={styles.activeBadge}>במשחק</div>
        )}
      </header>

      {isCashedOut ? (
        <div className={styles.cashedOutRow}>
          <span className={styles.cashedOutLabel}>
            יצא עם {player.cashedOut} ₪
          </span>
          <button
            type="button"
            className={styles.undoButton}
            onClick={() => dispatch({ type: 'undo-cash-out', id: player.id })}
          >
            בטל יציאה
          </button>
        </div>
      ) : (
        <div className={styles.actions}>
          <div className={styles.actionGroup}>
            <input
              type="number"
              inputMode="numeric"
              className={styles.amountInput}
              value={rebuyAmount}
              onChange={(e) => setRebuyAmount(e.target.value)}
              min={0}
              step={10}
              aria-label="סכום כניסה נוספת"
            />
            <button
              type="button"
              className={styles.rebuyButton}
              onClick={handleRebuy}
            >
              + כניסה
            </button>
          </div>

          {showCashOut ? (
            <div className={styles.actionGroup}>
              <input
                type="number"
                inputMode="numeric"
                className={styles.amountInput}
                value={cashOutAmount}
                onChange={(e) => setCashOutAmount(e.target.value)}
                placeholder="0"
                min={0}
                step={10}
                autoFocus
                aria-label="סכום יציאה"
              />
              <button
                type="button"
                className={styles.confirmButton}
                onClick={handleCashOut}
              >
                אשר
              </button>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => {
                  setShowCashOut(false);
                  setCashOutAmount('');
                }}
                aria-label="ביטול"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={styles.cashOutButton}
              onClick={() => setShowCashOut(true)}
            >
              יציאה
            </button>
          )}
        </div>
      )}

      <button
        type="button"
        className={styles.removeLink}
        onClick={() => dispatch({ type: 'remove-player', id: player.id })}
        aria-label={`הסר את ${player.name} מהמשחק`}
      >
        הסר שחקן
      </button>
    </article>
  );
}
