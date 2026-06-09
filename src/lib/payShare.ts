// =============================================================================
// payShare — WhatsApp sharing + Bit payment helpers for the settlement screen.
//
// Bit (bitpay.co.il) exposes no public deep link for pre-filled P2P payments,
// so the Bit side here is best-effort: it can only *launch* the app. The amount
// and recipient still have to be entered by hand inside Bit.
// =============================================================================

import i18n from '../i18n';
import type { Player, Settlement } from '../types';
import { getNet } from '../types';

// ---------------------------------------------------------------------------
// Phone numbers
// ---------------------------------------------------------------------------

/**
 * Normalises a free-text Israeli phone number to international digits
 * (e.g. "972521234567"), suitable for wa.me links. Returns null when the input
 * is not a plausible Israeli mobile number.
 */
export function normalizeIsraeliPhone(raw: string): string | null {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);

  if (digits.startsWith('972')) {
    // already international
  } else if (digits.startsWith('0')) {
    digits = '972' + digits.slice(1);
  } else if (digits.length === 9) {
    digits = '972' + digits;
  } else {
    return null;
  }

  return /^972\d{9}$/.test(digits) ? digits : null;
}

/** Formats an international number ("972521234567") as "052-123-4567". */
export function displayPhone(intl: string): string {
  const national = '0' + intl.slice(3);
  return `${national.slice(0, 3)}-${national.slice(3, 6)}-${national.slice(6)}`;
}

// ---------------------------------------------------------------------------
// WhatsApp
// ---------------------------------------------------------------------------

/** wa.me link with no recipient — opens WhatsApp's share sheet. */
export function whatsappShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/** wa.me link straight to one person's chat, pre-filled with `text`. */
export function whatsappDirectUrl(intlPhone: string, text: string): string {
  return `https://wa.me/${intlPhone}?text=${encodeURIComponent(text)}`;
}

/** The shareable end-of-game summary: results board + who-pays-who. */
export function buildSettlementSummary(
  players: Player[],
  transfers: Settlement[],
  date: Date = new Date(),
): string {
  const ranked = players
    .filter((p) => p.cashedOut !== null)
    .sort((a, b) => getNet(b) - getNet(a));

  const dateStr = date.toLocaleDateString(i18n.language || 'he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const lines: string[] = [
    i18n.t('payShare.summaryHeader', { date: dateStr }),
    '',
    i18n.t('payShare.summaryResults'),
  ];

  ranked.forEach((p, i) => {
    const net = getNet(p);
    const medal = i === 0 && net > 0 ? '🥇 ' : '';
    const sign = net > 0 ? '+' : net < 0 ? '−' : '';
    lines.push(`${medal}${p.name}: ${sign}${Math.abs(net)} ₪`);
  });

  if (transfers.length > 0) {
    lines.push('', i18n.t('payShare.summarySettlement'));
    for (const t of transfers) {
      lines.push(
        i18n.t('payShare.summaryTransfer', {
          from: t.from,
          amount: t.amount,
          to: t.to,
        }),
      );
    }
  }

  return lines.join('\n');
}

/** A short personal nudge sent to the player who owes money. */
export function buildDebtReminder(t: Settlement): string {
  return [
    i18n.t('payShare.reminderGreeting', { name: t.from }),
    i18n.t('payShare.reminderBody', { to: t.to, amount: t.amount }),
    i18n.t('payShare.reminderClosing'),
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Bit
// ---------------------------------------------------------------------------

export const BIT_APPSTORE_URL = 'https://apps.apple.com/il/app/bit/id1182007739';
export const BIT_PLAY_URL =
  'https://play.google.com/store/apps/details?id=com.bnhp.payments.paymentsapp';
const BIT_ANDROID_PACKAGE = 'com.bnhp.payments.paymentsapp';

export function isAndroid(): boolean {
  return typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
}

export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  if (/iphone|ipad|ipod/i.test(navigator.userAgent)) return true;
  // iPadOS 13+ reports itself as desktop Safari.
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
}

/**
 * Best-effort URL to open the Bit app. Bit has no documented deep link for
 * pre-filled payments, so this only launches the app:
 *  - Android: an intent: URL that opens Bit if installed, else Google Play.
 *  - iOS / desktop: the store page (opens the app if installed, else installs).
 */
export function bitLaunchUrl(): string {
  if (isAndroid()) {
    const fallback = encodeURIComponent(BIT_PLAY_URL);
    return `intent://#Intent;package=${BIT_ANDROID_PACKAGE};S.browser_fallback_url=${fallback};end`;
  }
  return isIOS() ? BIT_APPSTORE_URL : BIT_PLAY_URL;
}

/** Store page for installing Bit, chosen by platform. */
export function bitInstallUrl(): string {
  return isIOS() ? BIT_APPSTORE_URL : BIT_PLAY_URL;
}
