// Vitest setup: the unit suite runs in the Node environment (no DOM, no
// localStorage/navigator), so i18next's language detector falls back to the
// configured fallbackLng ('en'). The lib-level tests assert the Hebrew
// source-of-truth strings (e.g. the WhatsApp summary), so we pin the active
// language to Hebrew here — matching the app's default for Hebrew-locale users.
import i18n from './i18n';

await i18n.changeLanguage('he');
