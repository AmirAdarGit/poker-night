import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './CompleteProfile.module.scss';
import { useAuth } from '../../contexts/AuthContext';

export function CompleteProfile() {
  const { t } = useTranslation();
  const { setDisplayName, signOut } = useAuth();
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(t('completeProfile.errorNameRequired'));
      return;
    }
    setError(null);
    setSubmitting(true);
    const r = await setDisplayName(name);
    setSubmitting(false);
    if (!r.ok) setError(r.error ?? t('completeProfile.errorSaveFailed'));
  };

  return (
    <div className={styles.screen}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <h1 className={styles.title}>{t('completeProfile.title')}</h1>
        <p className={styles.subtitle}>{t('completeProfile.subtitle')}</p>
        <input
          type="text"
          className={styles.input}
          placeholder={t('completeProfile.placeholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        {error && <div className={styles.error}>{error}</div>}
        <button
          type="submit"
          className={styles.submitButton}
          disabled={submitting}
        >
          {submitting ? t('completeProfile.submitting') : t('completeProfile.continue')}
        </button>
        <button
          type="button"
          className={styles.signOut}
          onClick={() => void signOut()}
        >
          {t('completeProfile.signOut')}
        </button>
      </form>
    </div>
  );
}
