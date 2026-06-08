import { useState } from 'react';
import styles from './GroupForms.module.scss';
import { useGroup } from '../../contexts/GroupContext';

interface Props {
  initialCode?: string;
  onDone?: () => void;
  bare?: boolean;
}

export function JoinGroup({ initialCode, onDone, bare }: Props) {
  const { joinByCode } = useGroup();
  const [code, setCode] = useState(initialCode ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!code.trim() || busy) return;
    setBusy(true);
    setError(null);
    const res = await joinByCode(code);
    setBusy(false);
    if (res.ok) {
      setCode('');
      onDone?.();
    } else {
      setError(
        res.error === 'invalid-code'
          ? 'קוד לא תקין. בדקו ונסו שוב.'
          : 'ההצטרפות נכשלה. נסו שוב.',
      );
    }
  };

  const body = (
    <div className={styles.form}>
      <span className={styles.label}>הצטרף עם קוד הזמנה</span>
      <div className={styles.row}>
        <input
          className={styles.codeInput}
          placeholder="קוד בן 8 תווים"
          dir="ltr"
          maxLength={8}
          value={code}
          onChange={(e) => setCode(e.target.value.trim().toLowerCase())}
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
          disabled={!code.trim() || busy}
        >
          {busy ? 'רגע…' : 'הצטרף'}
        </button>
      </div>
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );

  return bare ? body : <div className={styles.panel}>{body}</div>;
}
