import {
  CreateTransactionSchema,
  TransactionSchema,
  TransactionsFilterSchema,
  TransactionsSummarySchema,
  UpdateTransactionSchema,
} from '@balance/shared';
import { createZodDto } from 'nestjs-zod';

export class CreateTransactionDto extends createZodDto(CreateTransactionSchema) {}
export class UpdateTransactionDto extends createZodDto(UpdateTransactionSchema) {}
export class TransactionsFilterDto extends createZodDto(TransactionsFilterSchema) {}
export class TransactionDto extends createZodDto(TransactionSchema) {}
export class TransactionsSummaryDto extends createZodDto(TransactionsSummarySchema) {}
