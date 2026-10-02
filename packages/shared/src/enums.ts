import { z } from 'zod';

export const ExpenseStatus = z.enum(['PLANNED', 'PAID']);
export type ExpenseStatus = z.infer<typeof ExpenseStatus>;

export const TransactionType = z.enum(['INCOME', 'EXPENSE']);
export type TransactionType = z.infer<typeof TransactionType>;
