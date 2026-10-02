import type { Transaction } from '@balance/shared';
import type { Transaction as TransactionRow } from '../generated/prisma/client';

export function toTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    amount: row.amount.toFixed(2),
    type: row.type,
    description: row.description,
    // Колонка @db.Date приходит как полночь UTC
    date: row.date.toISOString().slice(0, 10),
    categoryId: row.categoryId,
    createdAt: row.createdAt.toISOString(),
  };
}
