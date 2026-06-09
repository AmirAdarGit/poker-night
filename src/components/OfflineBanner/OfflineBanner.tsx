import { useTranslation } from 'react-i18next';
import styles from './OfflineBanner.module.scss';
import type { SyncStatus } from '../../hooks/useGameSync';

interface Props {
  status: SyncStatus;
}

export function OfflineBanner({ status }: Props) {
  const { t } = useTranslation();
  if (status === 'live' || status === 'local') return null;

  let message = '';
  let kind: 'offline' | 'connecting' | 'error' = 'offline';

  if (status === 'connecting') {
    message = t('offline.connecting');
    kind = 'connecting';
  } else if (status === 'offline') {
    message = t('offline.offline');
    kind = 'offline';
  } else if (status === 'error') {
    message = t('offline.error');
    kind = 'error';
  }

  return (
    <div className={`${styles.banner} ${styles[kind]}`} role="status">
      {message}
    </div>
  );
}
