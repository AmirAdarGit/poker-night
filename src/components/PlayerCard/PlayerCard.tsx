import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './PlayerCard.module.scss';
import type { Player } from '../../types';
import { sumBuyIns, getNet, DEFAULT_BUY_IN } from '../../types';
import type { Action } from '../../reducer/gameReducer';

interface Props {
  player: Player;
  dispatch: (a: Action) => void;
}

export function PlayerCard({ player, dispatch }: Props) {
  const { t } = useTranslation();
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

  // An empty field is NOT a 0 cash-out: Number('') is 0, which would wrongly
  // record the player as busting out and show a negative balance. Require an
  // actual typed value — to cash out at zero the user types "0" explicitly.
  const trimmedCashOut = cashOutAmount.trim();
  const cashOutValid =
    trimmedCashOut !== '' &&
    Number.isFinite(Number(trimmedCashOut)) &&
    Number(trimmedCashOut) >= 0;

  const handleCashOut = () => {
    if (!cashOutValid) return;
    dispatch({
      type: 'cash-out',
      id: player.id,
      amount: Number(trimmedCashOut),
    });
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
            {t('playerCard.invested', {
              amount: invested,
              count: player.buyIns.length,
              entries:
                player.buyIns.length === 1
                  ? t('playerCard.entryOne')
                  : t('playerCard.entryOther'),
            })}
          </div>
        </div>
        {isCashedOut ? (
          <div
            className={`${styles.netBadge} ${
              net >= 0 ? styles.netBadgePos : styles.netBadgeNeg
            }`}
          >
            {net >= 0 ? '+' : ''}
            {net} {t('common.currency')}
          </div>
        ) : (
          <div className={styles.activeBadge}>{t('playerCard.inGame')}</div>
        )}
      </header>

      {isCashedOut ? (
        <div className={styles.cashedOutRow}>
          <span className={styles.cashedOutLabel}>
            {t('playerCard.cashedOutWith', { amount: player.cashedOut })}
          </span>
          <button
            type="button"
            className={styles.undoButton}
            onClick={() => dispatch({ type: 'undo-cash-out', id: player.id })}
          >
            {t('playerCard.undoCashOut')}
          </button>
        </div>
      ) : (
        <div className={styles.actions}>
          {showCashOut ? (
            // Only the cash-out field is shown here — keeping the rebuy input
            // visible at the same time made it easy to type the cash-out
            // amount into the wrong box and confirm an empty (0) cash-out.
            <div className={styles.actionGroup}>
              <input
                type="number"
                inputMode="numeric"
                className={styles.amountInput}
                value={cashOutAmount}
                onChange={(e) => setCashOutAmount(e.target.value)}
                placeholder={t('playerCard.cashOutPlaceholder')}
                min={0}
                step={10}
                autoFocus
                aria-label={t('playerCard.cashOutLabel')}
              />
              <button
                type="button"
                className={styles.confirmButton}
                onClick={handleCashOut}
                disabled={!cashOutValid}
              >
                {t('playerCard.confirm')}
              </button>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => {
                  setShowCashOut(false);
                  setCashOutAmount('');
                }}
                aria-label={t('playerCard.cancel')}
              >
                ✕
              </button>
            </div>
          ) : (
            <>
              <div className={styles.actionGroup}>
                <input
                  type="number"
                  inputMode="numeric"
                  className={styles.amountInput}
                  value={rebuyAmount}
                  onChange={(e) => setRebuyAmount(e.target.value)}
                  min={0}
                  step={10}
                  aria-label={t('playerCard.rebuyLabel')}
                />
                <button
                  type="button"
                  className={styles.rebuyButton}
                  onClick={handleRebuy}
                >
                  {t('playerCard.addEntry')}
                </button>
              </div>
              <button
                type="button"
                className={styles.cashOutButton}
                onClick={() => setShowCashOut(true)}
              >
                {t('playerCard.cashOut')}
              </button>
            </>
          )}
        </div>
      )}

      <button
        type="button"
        className={styles.removeLink}
        onClick={() => dispatch({ type: 'remove-player', id: player.id })}
        aria-label={t('playerCard.removePlayerAria', { name: player.name })}
      >
        {t('playerCard.removePlayer')}
      </button>
    </article>
  );
}
