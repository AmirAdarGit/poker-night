import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './AuthScreen.module.scss';
import { useAuth } from '../../contexts/AuthContext';

type Mode = 'signin' | 'signup';

interface Props {
  onCancel?: () => void;
}

export function AuthScreen({ onCancel }: Props) {
  const { t } = useTranslation();
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
    if (!r.ok) setError(r.error ?? t('auth.errorSignInFailed'));
    setSubmitting(false);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!email.trim() || !password) {
      setError(t('auth.errorEmailPasswordRequired'));
      return;
    }
    if (mode === 'signup' && !displayName.trim()) {
      setError(t('auth.errorDisplayNameRequired'));
      return;
    }
    if (mode === 'signup' && password.length < 6) {
      setError(t('auth.errorPasswordTooShort'));
      return;
    }

    setSubmitting(true);
    const result =
      mode === 'signup'
        ? await signUpWithEmail(email.trim(), password, displayName.trim())
        : await signInWithEmail(email.trim(), password);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error ?? t('auth.errorGeneric'));
      return;
    }
    if (mode === 'signup') {
      setInfo(t('auth.signUpInfo'));
    }
  };

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <h1 className={styles.title}>{t('auth.title')}</h1>
        <p className={styles.subtitle}>
          {mode === 'signin'
            ? t('auth.subtitleSignIn')
            : t('auth.subtitleSignUp')}
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
          {t('auth.continueWithGoogle')}
        </button>

        <div className={styles.divider}>
          <span>{t('auth.or')}</span>
        </div>

        <form className={styles.form} onSubmit={handleEmailSubmit}>
          {mode === 'signup' && (
            <input
              type="text"
              className={styles.input}
              placeholder={t('auth.displayNamePlaceholder')}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="name"
              autoFocus
            />
          )}
          <input
            type="email"
            className={styles.input}
            placeholder={t('auth.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <input
            type="password"
            className={styles.input}
            placeholder={t('auth.passwordPlaceholder')}
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
              ? t('auth.submitting')
              : mode === 'signin'
                ? t('auth.signIn')
                : t('auth.signUp')}
          </button>
        </form>

        <div className={styles.footer}>
          {mode === 'signin' ? (
            <>
              {t('auth.noAccount')}{' '}
              <button
                type="button"
                className={styles.toggleButton}
                onClick={() => {
                  setMode('signup');
                  setError(null);
                  setInfo(null);
                }}
              >
                {t('auth.createAccount')}
              </button>
            </>
          ) : (
            <>
              {t('auth.haveAccount')}{' '}
              <button
                type="button"
                className={styles.toggleButton}
                onClick={() => {
                  setMode('signin');
                  setError(null);
                  setInfo(null);
                }}
              >
                {t('auth.signInLink')}
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
            {t('auth.continueWithoutAccount')}
          </button>
        )}
      </div>
    </div>
  );
}
