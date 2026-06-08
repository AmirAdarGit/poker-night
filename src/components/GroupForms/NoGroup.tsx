import styles from './GroupForms.module.scss';
import { CreateGroup } from './CreateGroup';
import { JoinGroup } from './JoinGroup';

interface Props {
  initialJoinCode?: string;
}

// Shown when a signed-in user belongs to no groups yet: create one or join an
// existing one with an invite code.
export function NoGroup({ initialJoinCode }: Props) {
  return (
    <div className={styles.panel}>
      <div className={styles.intro}>
        <h2 className={styles.title}>בואו נתחיל</h2>
        <p className={styles.subtitle}>
          קבוצה היא חבורת הפוקר שלכם — השחקנים, המשחקים וההיסטוריה נשמרים בתוכה.
          צרו קבוצה חדשה, או הצטרפו לקבוצה קיימת עם קוד הזמנה.
        </p>
      </div>
      <div className={styles.noGroup}>
        <CreateGroup bare />
        <div className={styles.divider}>או</div>
        <JoinGroup bare initialCode={initialJoinCode} />
      </div>
    </div>
  );
}
