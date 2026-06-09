import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './HistoryView.module.scss';
import { useAuth } from '../../contexts/AuthContext';
import { useGroup } from '../../contexts/GroupContext';
import {
  computeLeaderboard,
  fetchAllGames,
  type GameHistoryEntry,
} from '../../lib/history';
import { deleteGame } from '../../lib/supabase';
import { ConfirmDialog } from '../ConfirmDialog/ConfirmDialog';
import { getNet, type Player } from '../../types';

type Period = 'month' | '3months' | 'all';

const PERIODS: { key: Period; labelKey: string; days: number | null }[] = [
  { key: 'month', labelKey: 'history.periodMonth', days: 31 },
  { key: '3months', labelKey: 'history.period3Months', days: 93 },
  { key: 'all', labelKey: 'history.periodAll', days: null },
];

// Keeps games whose play date falls within the window. Undated rows are kept.
function filterByPeriod(
  games: GameHistoryEntry[],
  period: Period,
): GameHistoryEntry[] {
  const def = PERIODS.find((p) => p.key === period);
  if (!def || def.days == null) return games;
  const cutoff = Date.now() - def.days * 86_400_000;
  return games.filter((g) => {
    const t = Date.parse(g.completedAt ?? g.updatedAt);
    return Number.isNaN(t) ? true : t >= cutoff;
  });
}

interface Props {
  onClose: () => void;
  onOpenGame: (gameId: string) => void;
}

export function HistoryView({ onClose, onOpenGame }: Props) {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { activeGroupId, activeGroup } = useGroup();
  const [games, setGames] = useState<GameHistoryEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('month');
  // Game the user asked to delete (host-only), pending confirmation.
  const [pendingDelete, setPendingDelete] = useState<GameHistoryEntry | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  // A signed-in host may delete games they created (RLS enforces this too).
  const canDelete = (g: GameHistoryEntry) =>
    !!profile?.id && g.hostId === profile.id;

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setDeleting(true);
    const res = await deleteGame(target.gameId);
    setDeleting(false);
    setPendingDelete(null);
    if (res.ok) {
      setGames((prev) =>
        prev ? prev.filter((x) => x.gameId !== target.gameId) : prev,
      );
    } else {
      setError(res.error);
    }
  };

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

  // Games within the selected time window (by play date).
  const inPeriod = useMemo(
    () => (games ? filterByPeriod(games, period) : []),
    [games, period],
  );
  const leaderboard = useMemo(
    () => computeLeaderboard(inPeriod),
    [inPeriod],
  );
  const active = useMemo(
    () => inPeriod.filter((g) => g.isActive),
    [inPeriod],
  );
  const finished = useMemo(
    () => inPeriod.filter((g) => !g.isActive),
    [inPeriod],
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
          aria-label={t('history.back')}
        >
          ←
        </button>
        <h2 className={styles.title}>
          {t('history.title')}
          {activeGroup && (
            <span className={styles.groupTag}> · {activeGroup.name}</span>
          )}
        </h2>
      </header>

      {games && games.length > 0 && (
        <div className={styles.periods}>
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              className={`${styles.periodBtn} ${
                period === p.key ? styles.periodOn : ''
              }`}
              onClick={() => setPeriod(p.key)}
            >
              {t(p.labelKey)}
            </button>
          ))}
        </div>
      )}

      {error && <div className={styles.error}>{t('history.error', { error })}</div>}
      {!games && !error && <div className={styles.loading}>{t('history.loading')}</div>}

      {games && games.length === 0 && (
        <div className={styles.empty}>{t('history.emptyNoGames')}</div>
      )}

      {games && games.length > 0 && inPeriod.length === 0 && (
        <div className={styles.empty}>{t('history.emptyInPeriod')}</div>
      )}

      {active.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>{t('history.activeGames')}</h3>
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
                      {t('history.gameMeta', {
                        players: g.playerCount,
                        pot: g.totalPot,
                      })}
                    </span>
                  </div>
                  <span className={styles.gameActive}>{t('history.continueGame')}</span>
                </button>
                {canDelete(g) && (
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    aria-label={t('history.deleteGame')}
                    title={t('history.deleteGame')}
                    onClick={() => setPendingDelete(g)}
                  >
                    🗑
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {leaderboard.length >= 2 && (
        <div className={styles.awards}>
          <div className={`${styles.award} ${styles.awardMvp}`}>
            <span className={styles.awardLabel}>{t('history.mvp')}</span>
            <span className={styles.awardName}>{leaderboard[0]!.name}</span>
            <span className={`${styles.awardNet} ${styles.statPositive}`}>
              {leaderboard[0]!.totalNet >= 0 ? '+' : ''}
              {leaderboard[0]!.totalNet} {t('common.currency')}
            </span>
          </div>
          <div className={`${styles.award} ${styles.awardLast}`}>
            <span className={styles.awardLabel}>{t('history.worst')}</span>
            <span className={styles.awardName}>
              {leaderboard[leaderboard.length - 1]!.name}
            </span>
            <span className={`${styles.awardNet} ${styles.statNegative}`}>
              {leaderboard[leaderboard.length - 1]!.totalNet} {t('common.currency')}
            </span>
          </div>
        </div>
      )}

      {leaderboard.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>{t('history.leaderboard')}</h3>
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
                        {e.totalNet} {t('common.currency')}
                      </span>
                    </div>
                    <div className={styles.barTrack}>
                      <div
                        className={`${styles.barFill} ${pos ? styles.barPos : styles.barNeg}`}
                        style={{ width }}
                      />
                    </div>
                    <span className={styles.boardSub}>
                      {t('history.boardSub', {
                        games: e.gamesPlayed,
                        biggestWin: e.biggestWin,
                      })}
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
          <h3 className={styles.sectionTitle}>{t('history.perGame')}</h3>
          <div className={styles.gameGrid}>
            {finished.map((g) => (
              <div key={g.gameId} className={styles.gameCardWrap}>
              {canDelete(g) && (
                <button
                  type="button"
                  className={styles.cardDeleteBtn}
                  aria-label={t('history.deleteGame')}
                  title={t('history.deleteGame')}
                  onClick={() => setPendingDelete(g)}
                >
                  🗑
                </button>
              )}
              <button
                type="button"
                className={styles.gameCard}
                onClick={() => onOpenGame(g.gameId)}
              >
                <div className={styles.gameCardHead}>
                  <span className={styles.gameCardDate}>
                    {t('history.gameCardDate', {
                      date: formatDate(g.completedAt ?? g.updatedAt),
                    })}
                  </span>
                  <span className={styles.gameCardMeta}>
                    {t('history.gameCardPlayers', { count: g.playerCount })}
                  </span>
                </div>
                <ul className={styles.gcRows}>
                  {playerNets(g.players).map((row) => (
                    <li key={row.id} className={styles.gcRow}>
                      <span className={styles.gcName}>{row.name}</span>
                      <span
                        className={
                          row.active
                            ? styles.gcActive
                            : row.net >= 0
                              ? styles.statPositive
                              : styles.statNegative
                        }
                      >
                        {row.active
                          ? t('history.active')
                          : `${row.net >= 0 ? '+' : ''}${row.net}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title={t('history.deleteConfirmTitle')}
          message={t('history.deleteConfirmMessage')}
          confirmLabel={deleting ? t('common.wait') : t('history.deleteConfirmYes')}
          cancelLabel={t('common.cancel')}
          onConfirm={handleConfirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </section>
  );
}

// Per-player net for a game card: winners first, still-in players last.
function playerNets(players: Player[]) {
  return players
    .map((p) => ({
      id: p.id,
      name: p.name,
      net: getNet(p),
      active: p.cashedOut == null,
    }))
    .sort((a, b) => {
      if (a.active !== b.active) return a.active ? 1 : -1;
      return b.net - a.net;
    });
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
