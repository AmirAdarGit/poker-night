import type { Player, Settlement } from '../types';
import { getNet } from '../types';

interface Balance {
  id: string;
  name: string;
  net: number;
}

export function calculateSettlements(players: Player[]): Settlement[] {
  const balances: Balance[] = players
    .filter((p) => p.cashedOut !== null)
    .map((p) => ({ id: p.id, name: p.name, net: Math.round(getNet(p)) }))
    .filter((b) => b.net !== 0);

  const debtors = balances
    .filter((b) => b.net < 0)
    .sort((a, b) => a.net - b.net);
  const creditors = balances
    .filter((b) => b.net > 0)
    .sort((a, b) => b.net - a.net);

  const transfers: Settlement[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i]!;
    const creditor = creditors[j]!;
    const amount = Math.min(-debtor.net, creditor.net);

    if (amount > 0) {
      transfers.push({
        from: debtor.name,
        to: creditor.name,
        amount,
      });
      debtor.net += amount;
      creditor.net -= amount;
    }

    if (debtor.net === 0) i++;
    if (creditor.net === 0) j++;
  }

  return transfers;
}
