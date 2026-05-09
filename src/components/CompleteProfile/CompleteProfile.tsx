import { useState } from 'react';
import styles from './CompleteProfile.module.scss';
import { useAuth } from '../../contexts/AuthContext';

export function CompleteProfile() {
  const { setDisplayName, signOut } = useAuth();
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('שם תצוגה נדרש');
      return;
    }
    setError(null);
    setSubmitting(true);
    const r = await setDisplayName(name);
    setSubmitting(false);
    if (!r.ok) setError(r.error ?? 'שמירה נכשלה');
  };

  return (
    <div className={styles.screen}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <h1 className={styles.title}>איך נקרא לך?</h1>
        <p className={styles.subtitle}>
          זה השם שיופיע לחבריך במשחקים ובהיסטוריה.
        </p>
        <input
          type="text"
          className={styles.input}
          placeholder="שם מלא או כינוי"
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
          {submitting ? 'שומר…' : 'המשך'}
        </button>
        <button
          type="button"
          className={styles.signOut}
          onClick={() => void signOut()}
        >
          יציאה
        </button>
      </form>
    </div>
  );
}
