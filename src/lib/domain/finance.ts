export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';
export type PaymentMethod = 'PIX' | 'DEBIT' | 'CASH' | 'CREDIT_CARD';
export type TransactionStatus = 'PENDING' | 'PAID' | 'RECEIVED' | 'OVERDUE' | 'CANCELLED';
export type TransferDirection = 'OUT' | 'IN';

export function calculateAccountBalance(initialBalance: number, transactions: Array<{ type: TransactionType; amount: number; status: TransactionStatus; transfer_direction?: TransferDirection | null }>) {
  return transactions.reduce((balance, transaction) => {
    if (!['PAID', 'RECEIVED'].includes(transaction.status)) return balance;
    if (transaction.type === 'INCOME') return balance + transaction.amount;
    if (transaction.type === 'EXPENSE') return balance - transaction.amount;
    if (transaction.transfer_direction === 'IN') return balance + transaction.amount;
    if (transaction.transfer_direction === 'OUT') return balance - transaction.amount;
    return balance;
  }, initialBalance);
}

export function calculatePricePerLiter(totalAmount: number, liters: number) {
  if (liters <= 0) throw new Error('Liters must be greater than zero');
  return totalAmount / liters;
}

export function calculateFuelEfficiency(previousOdometer: number, currentOdometer: number, liters: number, totalAmount = 0) {
  const distance = currentOdometer - previousOdometer;
  if (distance <= 0 || liters <= 0) return null;
  return { distance, kilometersPerLiter: distance / liters, costPerKilometer: totalAmount > 0 ? totalAmount / distance : 0 };
}
