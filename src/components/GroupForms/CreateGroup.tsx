import { useState } from 'react';
import styles from './GroupForms.module.scss';
import { useGroup } from '../../contexts/GroupContext';

interface Props {
  // Called after a group is created (context already switches to it).
  onDone?: () => void;
  bare?: boolean; // omit the card wrapper (when embedded in a menu)
}

export function CreateGroup({ onDone, bare }: Props) {
  const { createGroup } = useGroup();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    setError(null);
    const res = await createGroup(name);
    setBusy(false);
    if (res.ok) {
      setName('');
      onDone?.();
    } else {
      setError('יצירת הקבוצה נכשלה. נסו שוב.');
    }
  };

  const body = (
    <div className={styles.form}>
      <span className={styles.label}>צור קבוצה חדשה</span>
      <div className={styles.row}>
        <input
          className={styles.input}
          placeholder="שם הקבוצה (למשל: פוקר רביעי)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void submit();
            }
          }}
        />
        <button
          type="button"
          className={styles.submit}
          onClick={() => void submit()}
          disabled={!name.trim() || busy}
        >
          {busy ? 'רגע…' : 'צור'}
        </button>
      </div>
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );

  return bare ? body : <div className={styles.panel}>{body}</div>;
}
