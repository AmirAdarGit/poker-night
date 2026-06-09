import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './GroupForms.module.scss';
import { useGroup } from '../../contexts/GroupContext';

interface Props {
  // Called after a group is created (context already switches to it).
  onDone?: () => void;
  bare?: boolean; // omit the card wrapper (when embedded in a menu)
}

export function CreateGroup({ onDone, bare }: Props) {
  const { t } = useTranslation();
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
      setError(t('groupForms.createFailed'));
    }
  };

  const body = (
    <div className={styles.form}>
      <span className={styles.label}>{t('groupForms.createLabel')}</span>
      <div className={styles.row}>
        <input
          className={styles.input}
          placeholder={t('groupForms.createPlaceholder')}
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
          {busy ? t('common.wait') : t('groupForms.create')}
        </button>
      </div>
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );

  return bare ? body : <div className={styles.panel}>{body}</div>;
}
