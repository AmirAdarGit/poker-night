import { useEffect, useMemo, useState } from 'react';
import styles from './HistoryView.module.scss';
import { useAuth } from '../../contexts/AuthContext';
import {
  computeLifetimeStats,
  computeOpponentSummaries,
  fetchMyGames,
  type GameHistoryEntry,
} from '../../lib/history';

interface Props {
  onClose: () => void;
  onOpenGame: (gameId: string) => void;
}

export function HistoryView({ onClose, onOpenGame }: Props) {
  const { user } = useAuth();
  const [games, setGames] = useState<GameHistoryEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetchMyGames(user.id)
      .then((rows) => {
        if (!cancelled) setGames(rows);
      })
      .catch((err) => {
        if (!cancelled) setError(String(err?.message ?? err));
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const lifetime = useMemo(
    () => (games ? computeLifetimeStats(games) : null),
    [games],
  );
  const opponents = useMemo(
    () => (games && user ? computeOpponentSummaries(games, user.id) : []),
    [games, user],
  );

  return (
    <section className={styles.view}>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="חזרה"
        >
          ←
        </button>
        <h2 className={styles.title}>ההיסטוריה שלך</h2>
      </header>

      {error && <div className={styles.error}>שגיאה: {error}</div>}

      {!games && !error && <div className={styles.loading}>טוען…</div>}

      {games && games.length === 0 && (
        <div className={styles.empty}>
          עדיין לא שיחקת אף משחק. צור משחק חדש כדי להתחיל לבנות את ההיסטוריה.
        </div>
      )}

      {games && lifetime && games.length > 0 && (
        <>
          <div className={styles.statsCard}>
            <div className={styles.statBlock}>
              <span className={styles.statLabel}>סה״כ רווח/הפסד</span>
              <span
                className={`${styles.statValue} ${
                  lifetime.settledTotalNet >= 0
                    ? styles.statPositive
                    : styles.statNegative
                }`}
              >
                {lifetime.settledTotalNet >= 0 ? '+' : ''}
                {lifetime.settledTotalNet} ₪
              </span>
              <span className={styles.statSub}>
                ב־{lifetime.settledGamesPlayed} משחקים שהסתיימו
              </span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statBlock}>
              <span className={styles.statLabel}>סה״כ משחקים</span>
              <span className={styles.statValue}>{lifetime.gamesPlayed}</span>
              <span className={styles.statSub}>כולל פעילים</span>
            </div>
          </div>

          {opponents.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>מול חברים</h3>
              <ul className={styles.opponents}>
                {opponents.map((o) => (
                  <li key={o.userId} className={styles.opponentRow}>
                    <div className={styles.opponentIdentity}>
                      <span className={styles.opponentName}>
                        {o.displayName}
                      </span>
                      <span className={styles.opponentMeta}>
                        {o.gamesTogether}{' '}
                        {o.gamesTogether === 1 ? 'משחק' : 'משחקים'} משותפים
                      </span>
                    </div>
                    <span
                      className={`${styles.opponentNet} ${
                        o.myNetWithThem >= 0
                          ? styles.statPositive
                          : styles.statNegative
                      }`}
                      title="הרווח/הפסד שלך במשחקים שבהם שיחקתם יחד"
                    >
                      {o.myNetWithThem >= 0 ? '+' : ''}
                      {o.myNetWithThem} ₪
                    </span>
                  </li>
                ))}
              </ul>
              <p className={styles.disclaimer}>
                המספר משקף את הרווח/הפסד שלך בכלל המשחקים שבהם הצד השני
                השתתף — לא בהכרח כסף שעבר ביניכם ישירות.
              </p>
            </div>
          )}

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>משחקים אחרונים</h3>
            <ul className={styles.games}>
              {games.map((g) => (
                <li key={g.gameId} className={styles.gameRow}>
                  <button
                    type="button"
                    className={styles.gameButton}
                    onClick={() => onOpenGame(g.gameId)}
                  >
                    <div className={styles.gameMain}>
                      <span className={styles.gameDate}>
                        {formatDate(g.updatedAt)}
                      </span>
                      <span className={styles.gameMeta}>
                        {g.playerCount} שחקנים · קופה {g.totalPot} ₪
                        {g.hostName && ` · מארח: ${g.hostName}`}
                      </span>
                    </div>
                    <span
                      className={`${styles.gameNet} ${
                        g.myStillIn
                          ? styles.gameActive
                          : g.myNet >= 0
                            ? styles.statPositive
                            : styles.statNegative
                      }`}
                    >
                      {g.myStillIn
                        ? 'פעיל'
                        : `${g.myNet >= 0 ? '+' : ''}${g.myNet} ₪`}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </section>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
  } catch {
    return iso;
  }
}
