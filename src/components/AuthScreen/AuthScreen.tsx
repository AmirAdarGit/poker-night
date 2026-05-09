import { useState } from 'react';
import styles from './AuthScreen.module.scss';
import { useAuth } from '../../contexts/AuthContext';

type Mode = 'signin' | 'signup';

interface Props {
  onCancel?: () => void;
}

export function AuthScreen({ onCancel }: Props) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleGoogle = async () => {
    setError(null);
    setSubmitting(true);
    const r = await signInWithGoogle();
    if (!r.ok) setError(r.error ?? 'התחברות נכשלה');
    setSubmitting(false);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!email.trim() || !password) {
      setError('אימייל וסיסמה נדרשים');
      return;
    }
    if (mode === 'signup' && !displayName.trim()) {
      setError('שם תצוגה נדרש');
      return;
    }
    if (mode === 'signup' && password.length < 6) {
      setError('סיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }

    setSubmitting(true);
    const result =
      mode === 'signup'
        ? await signUpWithEmail(email.trim(), password, displayName.trim())
        : await signInWithEmail(email.trim(), password);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error ?? 'אירעה שגיאה');
      return;
    }
    if (mode === 'signup') {
      setInfo(
        'אם אימות אימייל פעיל, בדקו את תיבת הדואר. אחרת אתם מחוברים.',
      );
    }
  };

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <h1 className={styles.title}>פוקר נייט</h1>
        <p className={styles.subtitle}>
          {mode === 'signin' ? 'כניסה לחשבון' : 'יצירת חשבון חדש'}
        </p>

        <button
          type="button"
          className={styles.googleButton}
          onClick={handleGoogle}
          disabled={submitting}
        >
          <span className={styles.googleIcon} aria-hidden="true">
            G
          </span>
          המשך עם Google
        </button>

        <div className={styles.divider}>
          <span>או</span>
        </div>

        <form className={styles.form} onSubmit={handleEmailSubmit}>
          {mode === 'signup' && (
            <input
              type="text"
              className={styles.input}
              placeholder="שם תצוגה"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="name"
              autoFocus
            />
          )}
          <input
            type="email"
            className={styles.input}
            placeholder="אימייל"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <input
            type="password"
            className={styles.input}
            placeholder="סיסמה"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            required
          />

          {error && <div className={styles.error}>{error}</div>}
          {info && <div className={styles.info}>{info}</div>}

          <button
            type="submit"
            className={styles.submitButton}
            disabled={submitting}
          >
            {submitting
              ? 'רגע…'
              : mode === 'signin'
                ? 'התחברות'
                : 'יצירת חשבון'}
          </button>
        </form>

        <div className={styles.footer}>
          {mode === 'signin' ? (
            <>
              עדיין אין חשבון?{' '}
              <button
                type="button"
                className={styles.toggleButton}
                onClick={() => {
                  setMode('signup');
                  setError(null);
                  setInfo(null);
                }}
              >
                יצירת חשבון
              </button>
            </>
          ) : (
            <>
              כבר יש חשבון?{' '}
              <button
                type="button"
                className={styles.toggleButton}
                onClick={() => {
                  setMode('signin');
                  setError(null);
                  setInfo(null);
                }}
              >
                כניסה
              </button>
            </>
          )}
        </div>

        {onCancel && (
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onCancel}
          >
            המשך לצפייה ללא חשבון
          </button>
        )}
      </div>
    </div>
  );
}
