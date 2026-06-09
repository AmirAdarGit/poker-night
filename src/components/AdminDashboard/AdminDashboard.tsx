import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './AdminDashboard.module.scss';
import { fetchAdminStats, type AdminStats } from '../../lib/admin';

interface Props {
  onClose: () => void;
}

export function AdminDashboard({ onClose }: Props) {
  const { t } = useTranslation();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStats(null);
    setError(null);
    fetchAdminStats()
      .then((res) => {
        if (cancelled) return;
        if (res.ok) setStats(res.stats);
        else setError(res.error);
      })
      .catch((err) => {
        if (!cancelled) setError(String(err?.message ?? err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className={styles.view}>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label={t('admin.back')}
        >
          ←
        </button>
        <h2 className={styles.title}>{t('admin.title')}</h2>
        <button type="button" className={styles.viewAsPlayer} onClick={onClose}>
          {t('admin.viewAsPlayer')}
        </button>
      </header>

      {error && <div className={styles.error}>{t('admin.error', { error })}</div>}
      {!stats && !error && <div className={styles.loading}>{t('admin.loading')}</div>}

      {stats && (
        <>
          {stats.generatedAt && (
            <p className={styles.generatedAt}>
              {t('admin.lastUpdated', { date: formatDateTime(stats.generatedAt) })}
            </p>
          )}

          <UsersSection users={stats.users} />
          <RevenueSection revenue={stats.revenue} />
          <GamesSection games={stats.games} />
          <PlayersSection players={stats.players} />
        </>
      )}
    </section>
  );
}

// ---------- Users & growth ----------
function UsersSection({ users }: { users: AdminStats['users'] }) {
  const { t } = useTranslation();
  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>{t('admin.usersTitle')}</h3>
      <div className={styles.statsCard}>
        <Stat label={t('admin.usersTotal')} value={users.total} />
        <div className={styles.statDivider} />
        <Stat label={t('admin.usersActive7d')} value={users.activeUsers7d} />
        <div className={styles.statDivider} />
        <Stat label={t('admin.usersPro')} value={users.proCount} />
        <div className={styles.statDivider} />
        <Stat label={t('admin.usersTrial')} value={users.trialCount} />
      </div>
      <Sparkline
        title={t('admin.signups30d')}
        points={users.signupsByDay}
      />
    </div>
  );
}

// ---------- Revenue & conversion ----------
function RevenueSection({ revenue }: { revenue: AdminStats['revenue'] }) {
  const { t } = useTranslation();
  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>{t('admin.revenueTitle')}</h3>
      <div className={styles.statsCard}>
        <Stat label={t('admin.revenueProCustomers')} value={revenue.proCount} />
        <div className={styles.statDivider} />
        <Stat label={t('admin.revenueGross')} value={`$${formatNum(revenue.grossUsd)}`} />
        <div className={styles.statDivider} />
        <Stat label={t('admin.revenueConversion')} value={`${formatNum(revenue.conversionPct)}%`} />
      </div>
      {revenue.proUsers.length > 0 ? (
        <ul className={styles.list}>
          {revenue.proUsers.map((u, i) => (
            <li key={`${u.email ?? u.displayName}-${i}`} className={styles.listRow}>
              <div className={styles.listIdentity}>
                <span className={styles.listName}>{u.displayName}</span>
                {u.email && <span className={styles.listMeta}>{u.email}</span>}
              </div>
              <span className={styles.listValue}>
                {u.proSince ? formatDate(u.proSince) : '—'}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className={styles.empty}>{t('admin.revenueEmpty')}</div>
      )}
    </div>
  );
}

// ---------- Game activity ----------
function GamesSection({ games }: { games: AdminStats['games'] }) {
  const { t } = useTranslation();
  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>{t('admin.gamesTitle')}</h3>
      <div className={styles.statsCard}>
        <Stat label={t('admin.gamesTotal')} value={games.total} />
        <div className={styles.statDivider} />
        <Stat
          label={t('admin.gamesAvgPot')}
          value={games.avgPot == null ? '—' : `${formatNum(games.avgPot)} ₪`}
        />
      </div>
      <Sparkline title={t('admin.games30d')} points={games.gamesByDay} />
      {games.topHosts.length > 0 && (
        <>
          <h4 className={styles.subTitle}>{t('admin.topHosts')}</h4>
          <ul className={styles.list}>
            {games.topHosts.map((h, i) => (
              <li key={`${h.displayName}-${i}`} className={styles.listRow}>
                <div className={styles.listIdentity}>
                  <span className={styles.rank}>{i + 1}</span>
                  <span className={styles.listName}>{h.displayName}</span>
                </div>
                <span className={styles.listValue}>{t('admin.hostGames', { count: h.games })}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

// ---------- Users by language / breakdown ----------
function PlayersSection({ players }: { players: AdminStats['players'] }) {
  const { t } = useTranslation();
  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>{t('admin.playersTitle')}</h3>
      {players.byLocale.length > 0 && (
        <ul className={styles.list}>
          {players.byLocale.map((l) => (
            <li key={l.locale} className={styles.listRow}>
              <span className={styles.listName}>{l.locale || '—'}</span>
              <span className={styles.listValue}>{t('admin.localeUsers', { count: l.users })}</span>
            </li>
          ))}
        </ul>
      )}

      {players.users.length > 0 ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t('admin.tableName')}</th>
                <th>{t('admin.tableEmail')}</th>
                <th>{t('admin.tableGames')}</th>
                <th>{t('admin.tablePro')}</th>
                <th>{t('admin.tableLocale')}</th>
              </tr>
            </thead>
            <tbody>
              {players.users.map((u, i) => (
                <tr key={`${u.email ?? u.displayName}-${i}`}>
                  <td className={styles.tdName}>{u.displayName}</td>
                  <td className={styles.tdMuted}>{u.email ?? '—'}</td>
                  <td className={styles.tdNum}>{u.gamesHosted}</td>
                  <td>
                    {u.isPro ? (
                      <span className={styles.proBadge}>Pro</span>
                    ) : (
                      <span className={styles.tdMuted}>—</span>
                    )}
                  </td>
                  <td className={styles.tdMuted}>{u.locale ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.empty}>{t('admin.playersEmpty')}</div>
      )}
    </div>
  );
}

// ---------- shared bits ----------
function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className={styles.statBlock}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{value}</span>
    </div>
  );
}

// CSS-only sparkline: one bar per day, height scaled to the busiest day.
function Sparkline({
  title,
  points,
}: {
  title: string;
  points: { date: string; count: number }[];
}) {
  const { t } = useTranslation();
  const max = useMemo(
    () => points.reduce((m, p) => Math.max(m, p.count), 1),
    [points],
  );
  if (points.length === 0) {
    return (
      <div className={styles.sparkBlock}>
        <span className={styles.sparkTitle}>{title}</span>
        <div className={styles.empty}>{t('admin.sparkEmpty')}</div>
      </div>
    );
  }
  return (
    <div className={styles.sparkBlock}>
      <span className={styles.sparkTitle}>{title}</span>
      <div className={styles.sparkBars}>
        {points.map((p) => (
          <div
            key={p.date}
            className={styles.sparkBar}
            style={{ height: `${Math.max((p.count / max) * 100, 3)}%` }}
            title={`${p.date}: ${p.count}`}
          />
        ))}
      </div>
    </div>
  );
}

function formatNum(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}
