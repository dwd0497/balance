import { Injectable } from '@nestjs/common';
import type { Category } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface CategoryData {
  name: string;
  color: string;
}

/** Все операции ограничены владельцем: чужая категория неотличима от несуществующей. */
@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllByUser(userId: string): Promise<Category[]> {
    return this.prisma.category.findMany({ where: { userId }, orderBy: { name: 'asc' } });
  }

  findOne(id: string, userId: string): Promise<Category | null> {
    return this.prisma.category.findFirst({ where: { id, userId } });
  }

  create(userId: string, data: CategoryData): Promise<Category> {
    return this.prisma.category.create({ data: { ...data, userId } });
  }

  async createMany(userId: string, items: CategoryData[]): Promise<void> {
    await this.prisma.category.createMany({
      data: items.map((item) => ({ ...item, userId })),
      skipDuplicates: true,
    });
  }

  /** Нет категории у пользователя → Prisma P2025. */
  update(id: string, userId: string, data: Partial<CategoryData>): Promise<Category> {
    return this.prisma.category.update({ where: { id, userId }, data });
  }

  /** Нет категории у пользователя → P2025; есть расходы → P2003. */
  async delete(id: string, userId: string): Promise<void> {
    await this.prisma.category.delete({ where: { id, userId } });
  }
}
