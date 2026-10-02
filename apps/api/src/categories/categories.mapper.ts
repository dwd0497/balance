import type { Category } from '@balance/shared';
import type { Category as CategoryRow } from '../generated/prisma/client';

export function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
