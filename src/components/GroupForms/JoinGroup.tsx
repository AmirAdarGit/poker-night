import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './GroupForms.module.scss';
import { useGroup } from '../../contexts/GroupContext';

interface Props {
  initialCode?: string;
  onDone?: () => void;
  bare?: boolean;
}

export function JoinGroup({ initialCode, onDone, bare }: Props) {
  const { t } = useTranslation();
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
          ? t('groupForms.invalidCode')
          : t('groupForms.joinFailed'),
      );
    }
  };

  const body = (
    <div className={styles.form}>
      <span className={styles.label}>{t('groupForms.joinLabel')}</span>
      <div className={styles.row}>
        <input
          className={styles.codeInput}
          placeholder={t('groupForms.joinPlaceholder')}
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
          {busy ? t('common.wait') : t('groupForms.join')}
        </button>
      </div>
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );

  return bare ? body : <div className={styles.panel}>{body}</div>;
}
