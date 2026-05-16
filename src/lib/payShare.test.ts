import { describe, expect, it } from 'vitest';
import {
  buildDebtReminder,
  buildSettlementSummary,
  displayPhone,
  normalizeIsraeliPhone,
  whatsappDirectUrl,
  whatsappShareUrl,
} from './payShare';
import type { Player } from '../types';

describe('normalizeIsraeliPhone', () => {
  it('normalises the local mobile format', () => {
    expect(normalizeIsraeliPhone('0521234567')).toBe('972521234567');
  });

  it('strips separators and spaces', () => {
    expect(normalizeIsraeliPhone('052-123-4567')).toBe('972521234567');
    expect(normalizeIsraeliPhone('052 123 4567')).toBe('972521234567');
  });

  it('accepts international forms', () => {
    expect(normalizeIsraeliPhone('+972521234567')).toBe('972521234567');
    expect(normalizeIsraeliPhone('972521234567')).toBe('972521234567');
    expect(normalizeIsraeliPhone('00972521234567')).toBe('972521234567');
  });

  it('accepts a 9-digit national number without a leading zero', () => {
    expect(normalizeIsraeliPhone('521234567')).toBe('972521234567');
  });

  it('rejects junk and wrong-length input', () => {
    expect(normalizeIsraeliPhone('')).toBeNull();
    expect(normalizeIsraeliPhone('12345')).toBeNull();
    expect(normalizeIsraeliPhone('052123456')).toBeNull(); // too short
    expect(normalizeIsraeliPhone('05212345678')).toBeNull(); // too long
  });
});

describe('displayPhone', () => {
  it('formats an international number for display', () => {
    expect(displayPhone('972521234567')).toBe('052-123-4567');
  });
});

describe('whatsapp links', () => {
  it('builds an encoded share link', () => {
    expect(whatsappShareUrl('hello world')).toBe(
      'https://wa.me/?text=hello%20world',
    );
  });

  it('builds an encoded direct link', () => {
    expect(whatsappDirectUrl('972521234567', 'hi')).toBe(
      'https://wa.me/972521234567?text=hi',
    );
  });
});

describe('summary text', () => {
  const mk = (
    id: string,
    name: string,
    buyIns: number[],
    cashedOut: number | null,
  ): Player => ({ id, name, buyIns, cashedOut, joinedAt: 0 });

  it('lists results and transfers', () => {
    const players = [mk('a', 'Amir', [50], 120), mk('b', 'Dani', [50], 0)];
    const transfers = [
      { from: 'Dani', to: 'Amir', fromId: 'b', toId: 'a', amount: 50 },
    ];
    const summary = buildSettlementSummary(
      players,
      transfers,
      new Date('2026-05-16'),
    );
    expect(summary).toContain('פוקר נייט');
    expect(summary).toContain('Amir');
    expect(summary).toContain('Dani');
    expect(summary).toContain('50 ₪');
  });

  it('builds a debt reminder addressed to the debtor', () => {
    const reminder = buildDebtReminder({
      from: 'Dani',
      to: 'Amir',
      fromId: 'b',
      toId: 'a',
      amount: 50,
    });
    expect(reminder).toContain('Dani');
    expect(reminder).toContain('Amir');
    expect(reminder).toContain('50 ₪');
  });
});
