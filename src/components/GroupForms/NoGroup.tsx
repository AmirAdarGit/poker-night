import { useTranslation } from 'react-i18next';
import styles from './GroupForms.module.scss';
import { CreateGroup } from './CreateGroup';
import { JoinGroup } from './JoinGroup';

interface Props {
  initialJoinCode?: string;
}

// Shown when a signed-in user belongs to no groups yet: create one or join an
// existing one with an invite code.
export function NoGroup({ initialJoinCode }: Props) {
  const { t } = useTranslation();
  return (
    <div className={styles.panel}>
      <div className={styles.intro}>
        <h2 className={styles.title}>{t('noGroup.title')}</h2>
        <p className={styles.subtitle}>{t('noGroup.subtitle')}</p>
      </div>
      <div className={styles.noGroup}>
        <CreateGroup bare />
        <div className={styles.divider}>{t('noGroup.or')}</div>
        <JoinGroup bare initialCode={initialJoinCode} />
      </div>
    </div>
  );
}
