import { useTranslation } from 'react-i18next';
import styles from './TrialBanner.module.scss';
import type { Entitlement } from '../../lib/entitlement';

interface Props {
  entitlement: Entitlement | null;
  onUpgrade: () => void;
}

// Thresholds for nudging the user before the trial actually locks.
const GAMES_NUDGE = 2;
const DAYS_NUDGE = 14;

export function TrialBanner({ entitlement, onUpgrade }: Props) {
  const { t } = useTranslation();
  if (!entitlement || entitlement.isPro || entitlement.locked) return null;

  const { gamesLeft, daysLeft } = entitlement;
  const nearGames = gamesLeft <= GAMES_NUDGE;
  const nearDays = daysLeft <= DAYS_NUDGE;
  if (!nearGames && !nearDays) return null;

  // Whichever limit is closer drives the message.
  const message =
    nearGames && gamesLeft <= daysLeft / 7
      ? t('trialBanner.gamesLeft', { count: gamesLeft })
      : daysLeft <= 1
        ? t('trialBanner.daysLeftToday')
        : t('trialBanner.daysLeft', { count: daysLeft });

  return (
    <div className={styles.banner} role="status">
      <span>{message}</span>
      <button type="button" className={styles.upgrade} onClick={onUpgrade}>
        {t('trialBanner.upgrade')}
      </button>
    </div>
  );
}
