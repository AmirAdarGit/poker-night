import { useMemo } from 'react';
import styles from './SettlementPhase.module.scss';
import type { Player } from '../../types';
import {
  getNet,
  sumBuyIns,
  totalCashedOut,
  totalPot,
} from '../../types';
import { calculateSettlements } from '../../lib/settlement';

interface Props {
  players: Player[];
  onBackToPlaying: () => void;
  onRequestNewGame: () => void;
  isHost: boolean;
}

export function SettlementPhase({
  players,
  onBackToPlaying,
  onRequestNewGame,
  isHost,
}: Props) {
  const ranked = useMemo(
    () =>
      [...players].sort((a, b) => {
        const aActive = a.cashedOut === null;
        const bActive = b.cashedOut === null;
        if (aActive && !bActive) return 1;
        if (!aActive && bActive) return -1;
        return getNet(b) - getNet(a);
      }),
    [players],
  );

  const transfers = useMemo(() => calculateSettlements(players), [players]);
  const stillIn = players.filter((p) => p.cashedOut === null);
  const pot = totalPot(players);
  const out = totalCashedOut(players);
  const diff = out - pot;
  const balanced = stillIn.length === 0 && diff === 0;

  return (
    <section className={styles.phase}>
      <h2 className={styles.heading}>חישוב סופי</h2>

      {!balanced && (
        <div className={styles.warning}>
          {stillIn.length > 0 ? (
            <>
              <strong>שחקנים שעדיין לא יצאו:</strong>{' '}
              {stillIn.map((p) => p.name).join(', ')}
            </>
          ) : (
            <>
              <strong>החישוב לא מאוזן:</strong> בקופה {pot} ₪, יצאו {out} ₪
              ({diff > 0 ? '+' : ''}
              {diff} ₪)
            </>
          )}
        </div>
      )}

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>תוצאות</h3>
        <ul className={styles.results}>
          {ranked.map((p) => {
            const invested = sumBuyIns(p);
            const isOut = p.cashedOut !== null;
            const net = getNet(p);
            return (
              <li key={p.id} className={styles.resultRow}>
                <div className={styles.resultIdentity}>
                  <span className={styles.resultName}>{p.name}</span>
                  <span className={styles.resultMeta}>
                    {isOut
                      ? `יצא עם ${p.cashedOut} ₪ · השקיע ${invested} ₪`
                      : `עוד במשחק · השקיע ${invested} ₪`}
                  </span>
                </div>
                {isOut ? (
                  <span
                    className={`${styles.resultNet} ${
                      net >= 0 ? styles.resultNetPos : styles.resultNetNeg
                    }`}
                  >
                    {net >= 0 ? '+' : ''}
                    {net} ₪
                  </span>
                ) : (
                  <span className={styles.resultActive}>פעיל</span>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>העברות לסגירת חובות</h3>
        {transfers.length === 0 ? (
          <div className={styles.empty}>
            {stillIn.length > 0
              ? 'יוצגו כאן העברות לאחר שכל השחקנים יצאו'
              : 'אין צורך בהעברות — החשבון מאוזן'}
          </div>
        ) : (
          <ul className={styles.transfers}>
            {transfers.map((t, i) => (
              <li key={i} className={styles.transferRow}>
                <span className={styles.transferFrom}>{t.from}</span>
                <span className={styles.transferArrow}>←</span>
                <span className={styles.transferAmount}>{t.amount} ₪</span>
                <span className={styles.transferArrow}>←</span>
                <span className={styles.transferTo}>{t.to}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.footer}>
        {isHost && (
          <button
            type="button"
            className={styles.backButton}
            onClick={onBackToPlaying}
          >
            חזרה למשחק
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
