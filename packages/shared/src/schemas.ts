import { z } from 'zod';
import { ExpenseStatus } from './enums';

/** Денежная сумма передаётся строкой, чтобы не терять точность Decimal. */
export const Money = z.string().regex(/^\d{1,10}(\.\d{1,2})?$/, 'Неверный формат суммы');

export const ProjectSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(200),
  address: z.string().max(500).nullable(),
  budget: Money.nullable(),
  currency: z.string().length(3),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Project = z.infer<typeof ProjectSchema>;

export const CreateProjectSchema = ProjectSchema.pick({ name: true }).extend({
  address: z.string().max(500).optional(),
  budget: Money.optional(),
  currency: z.string().length(3).default('RUB'),
});
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

export const RoomSchema = z.object({
  id: z.uuid(),
  projectId: z.uuid(),
  name: z.string().min(1).max(100),
});
export type Room = z.infer<typeof RoomSchema>;

export const ExpenseSchema = z.object({
  id: z.uuid(),
  projectId: z.uuid(),
  categoryId: z.uuid(),
  roomId: z.uuid().nullable(),
  title: z.string().min(1).max(200),
  amount: Money,
  quantity: z.number().positive().nullable(),
  vendor: z.string().max(200).nullable(),
  status: ExpenseStatus,
  spentAt: z.iso.date(),
  note: z.string().max(2000).nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Expense = z.infer<typeof ExpenseSchema>;

export const CreateExpenseSchema = ExpenseSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial({ roomId: true, quantity: true, vendor: true, note: true, status: true });
export type CreateExpenseInput = z.infer<typeof CreateExpenseSchema>;

export const UpdateExpenseSchema = CreateExpenseSchema.omit({ projectId: true }).partial();
export type UpdateExpenseInput = z.infer<typeof UpdateExpenseSchema>;
