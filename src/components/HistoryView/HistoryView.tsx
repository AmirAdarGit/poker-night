import { useEffect, useMemo, useState } from 'react';
import styles from './HistoryView.module.scss';
import { useAuth } from '../../contexts/AuthContext';
import { useGroup } from '../../contexts/GroupContext';
import {
  computeLeaderboard,
  fetchAllGames,
  type GameHistoryEntry,
} from '../../lib/history';

interface Props {
  onClose: () => void;
  onOpenGame: (gameId: string) => void;
}

export function HistoryView({ onClose, onOpenGame }: Props) {
  const { profile } = useAuth();
  const { activeGroupId, activeGroup } = useGroup();
  const [games, setGames] = useState<GameHistoryEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setGames(null);
    fetchAllGames(activeGroupId)
      .then((rows) => {
        if (!cancelled) setGames(rows);
      })
      .catch((err) => {
        if (!cancelled) setError(String(err?.message ?? err));
      });
    return () => {
      cancelled = true;
    };
  }, [activeGroupId]);

  const leaderboard = useMemo(
    () => (games ? computeLeaderboard(games) : []),
    [games],
  );
  const active = useMemo(
    () => (games ? games.filter((g) => g.isActive) : []),
    [games],
  );
  const finished = useMemo(
    () => (games ? games.filter((g) => !g.isActive) : []),
    [games],
  );
  // Largest absolute net on the board — scales the bar widths.
  const maxAbsNet = useMemo(
    () => leaderboard.reduce((m, e) => Math.max(m, Math.abs(e.totalNet)), 1),
    [leaderboard],
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
        <h2 className={styles.title}>
          היסטוריה וטבלת מובילים
          {activeGroup && (
            <span className={styles.groupTag}> · {activeGroup.name}</span>
          )}
        </h2>
      </header>

      {error && <div className={styles.error}>שגיאה: {error}</div>}
      {!games && !error && <div className={styles.loading}>טוען…</div>}

      {games && games.length === 0 && (
        <div className={styles.empty}>
          עדיין אין משחקים. צרו משחק חדש כדי להתחיל לבנות את ההיסטוריה.
        </div>
      )}

      {active.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>משחקים פעילים</h3>
          <ul className={styles.games}>
            {active.map((g) => (
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
                    </span>
                  </div>
                  <span className={styles.gameActive}>המשך משחק ←</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {leaderboard.length >= 2 && (
        <div className={styles.awards}>
          <div className={`${styles.award} ${styles.awardMvp}`}>
            <span className={styles.awardLabel}>★ MVP התקופה</span>
            <span className={styles.awardName}>{leaderboard[0]!.name}</span>
            <span className={`${styles.awardNet} ${styles.statPositive}`}>
              {leaderboard[0]!.totalNet >= 0 ? '+' : ''}
              {leaderboard[0]!.totalNet} ₪
            </span>
          </div>
          <div className={`${styles.award} ${styles.awardLast}`}>
            <span className={styles.awardLabel}>אדום התקופה</span>
            <span className={styles.awardName}>
              {leaderboard[leaderboard.length - 1]!.name}
            </span>
            <span className={`${styles.awardNet} ${styles.statNegative}`}>
              {leaderboard[leaderboard.length - 1]!.totalNet} ₪
            </span>
          </div>
        </div>
      )}

      {leaderboard.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>טבלת מובילים</h3>
          <ul className={styles.board}>
            {leaderboard.map((e, i) => {
              const pos = e.totalNet >= 0;
              const width = `${Math.round((Math.abs(e.totalNet) / maxAbsNet) * 100)}%`;
              const isYou = profile?.display_name === e.name;
              return (
                <li
                  key={e.key}
                  className={`${styles.boardRow} ${isYou ? styles.boardYou : ''}`}
                >
                  <span className={styles.rank}>{i + 1}</span>
                  <div className={styles.boardMain}>
                    <div className={styles.boardTop}>
                      <span className={styles.boardName}>{e.name}</span>
                      <span
                        className={`${styles.boardNet} ${pos ? styles.statPositive : styles.statNegative}`}
                      >
                        {pos ? '+' : ''}
                        {e.totalNet} ₪
                      </span>
                    </div>
                    <div className={styles.barTrack}>
                      <div
                        className={`${styles.barFill} ${pos ? styles.barPos : styles.barNeg}`}
                        style={{ width }}
                      />
                    </div>
                    <span className={styles.boardSub}>
                      {e.gamesPlayed} משחקים · שיא רווח {e.biggestWin} ₪
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {finished.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>משחקים שהסתיימו</h3>
          <ul className={styles.games}>
            {finished.map((g) => (
              <li key={g.gameId} className={styles.gameRow}>
                <button
                  type="button"
                  className={styles.gameButton}
                  onClick={() => onOpenGame(g.gameId)}
                >
                  <div className={styles.gameMain}>
                    <span className={styles.gameDate}>
                      {formatDate(g.completedAt ?? g.updatedAt)}
                    </span>
                    <span className={styles.gameMeta}>
                      {g.playerCount} שחקנים · קופה {g.totalPot} ₪
                      {g.topName && ` · מנצח ${g.topName}`}
                    </span>
                  </div>
                  {g.topName && (
                    <span className={`${styles.gameNet} ${styles.statPositive}`}>
                      +{g.topNet} ₪
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
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
