import styles from './OfflineBanner.module.scss';
import type { SyncStatus } from '../../hooks/useGameSync';

interface Props {
  status: SyncStatus;
}

export function OfflineBanner({ status }: Props) {
  if (status === 'live' || status === 'local') return null;

  let message = '';
  let kind: 'offline' | 'connecting' | 'error' = 'offline';

  if (status === 'connecting') {
    message = 'מתחבר…';
    kind = 'connecting';
  } else if (status === 'offline') {
    message = 'במצב לא מקוון — שינויים לא יסונכרנו עד שתחזור הגישה';
    kind = 'offline';
  } else if (status === 'error') {
    message = 'בעיית סנכרון — נסיון חיבור מחדש';
    kind = 'error';
  }

  return (
    <div className={`${styles.banner} ${styles[kind]}`} role="status">
      {message}
    </div>
  );
}
