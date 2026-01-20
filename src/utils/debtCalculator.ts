import type { Trip, Debt } from '../types';

export const calculateDebts = (trip: Trip): Debt[] => {
  const balances: { [key: string]: number } = {};
  trip.members.forEach(m => balances[m.id] = 0);

  trip.expenses.forEach(expense => {
    balances[expense.payerId] += expense.amount;

    if (expense.splitType === 'EXACT' && expense.splitDetails) {
      // Handle Unequal Split
      Object.entries(expense.splitDetails).forEach(([memberId, amount]) => {
        if (balances[memberId] !== undefined) {
          balances[memberId] -= amount;
        }
      });
      // Sanity Check: If splitDetails sum != total, we assume the payer covers the diff or it's just a loss.
      // For V1, we assume form validation ensures this matches.
    } else {
      // Default: Equal Split
      const amountPerPerson = expense.amount / expense.participantIds.length;
      expense.participantIds.forEach(pId => {
        balances[pId] -= amountPerPerson;
      });
    }
  });

  const debtors = Object.keys(balances).filter(id => balances[id] < -0.01).sort((a, b) => balances[a] - balances[b]);
  const creditors = Object.keys(balances).filter(id => balances[id] > 0.01).sort((a, b) => balances[b] - balances[a]);

  const debts: Debt[] = [];
  let i = 0;
  let j = 0;
  const tempBalances = { ...balances };

  while (i < debtors.length && j < creditors.length) {
    const debtorId = debtors[i];
    const creditorId = creditors[j];
    const amountToPay = Math.min(Math.abs(tempBalances[debtorId]), tempBalances[creditorId]);

    if (amountToPay > 0.01) {
      debts.push({ from: debtorId, to: creditorId, amount: amountToPay });
    }

    tempBalances[debtorId] += amountToPay;
    tempBalances[creditorId] -= amountToPay;

    if (Math.abs(tempBalances[debtorId]) < 0.01) i++;
    if (tempBalances[creditorId] < 0.01) j++;
  }
  return debts;
};