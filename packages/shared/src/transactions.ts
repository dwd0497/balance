import { z } from 'zod';
import { TransactionType } from './enums';
import { Money } from './schemas';

/** Сумма операции: всегда положительная, направление задаёт `type`. */
const TransactionAmount = Money.refine(
  (value) => Number(value) > 0,
  'Сумма должна быть больше нуля',
);
const Description = z.string().trim().max(500);

export const TransactionSchema = z.object({
  id: z.uuid(),
  amount: Money,
  type: TransactionType,
  description: Description.nullable(),
  /** Дата операции `YYYY-MM-DD`, без времени. */
  date: z.iso.date(),
  categoryId: z.uuid(),
  createdAt: z.iso.datetime(),
});
export type Transaction = z.infer<typeof TransactionSchema>;

export const CreateTransactionSchema = z.object({
  amount: TransactionAmount,
  type: TransactionType,
  description: Description.optional(),
  date: z.iso.date(),
  categoryId: z.uuid(),
});
export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;

export const UpdateTransactionSchema = CreateTransactionSchema.extend({
  /** `null` очищает описание. */
  description: Description.nullable().optional(),
}).partial();
export type UpdateTransactionInput = z.infer<typeof UpdateTransactionSchema>;

/** Фильтры списка и сводки; границы периода включительно. */
export const TransactionsFilterSchema = z
  .object({
    type: TransactionType.optional(),
    categoryId: z.uuid().optional(),
    from: z.iso.date().optional(),
    to: z.iso.date().optional(),
  })
  .refine((f) => !f.from || !f.to || f.from <= f.to, {
    message: 'Начало периода позже конца',
    path: ['from'],
  });
export type TransactionsFilter = z.infer<typeof TransactionsFilterSchema>;

export const TransactionsSummarySchema = z.object({
  income: Money,
  expense: Money,
  /** income − expense; может быть отрицательным. */
  balance: z.string(),
});
export type TransactionsSummary = z.infer<typeof TransactionsSummarySchema>;
