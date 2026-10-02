import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '@balance/shared';
import { Prisma } from '../generated/prisma/client';
import { toCategory } from './categories.mapper';
import { CategoriesRepository } from './categories.repository';

const NOT_FOUND = 'Категория не найдена';
const NAME_TAKEN = 'Категория с таким названием уже существует';

@Injectable()
export class CategoriesService {
  constructor(private readonly categories: CategoriesRepository) {}

  async findAll(userId: string): Promise<Category[]> {
    const rows = await this.categories.findAllByUser(userId);
    return rows.map(toCategory);
  }

  async findOne(userId: string, id: string): Promise<Category> {
    const row = await this.categories.findOne(id, userId);
    if (!row) throw new NotFoundException(NOT_FOUND);
    return toCategory(row);
  }

  async create(userId: string, input: CreateCategoryInput): Promise<Category> {
    try {
      return toCategory(await this.categories.create(userId, input));
    } catch (error) {
      if (isPrismaError(error, 'P2002')) throw new ConflictException(NAME_TAKEN);
      throw error;
    }
  }

  async update(userId: string, id: string, input: UpdateCategoryInput): Promise<Category> {
    try {
      return toCategory(await this.categories.update(id, userId, input));
    } catch (error) {
      if (isPrismaError(error, 'P2025')) throw new NotFoundException(NOT_FOUND);
      if (isPrismaError(error, 'P2002')) throw new ConflictException(NAME_TAKEN);
      throw error;
    }
  }

  async remove(userId: string, id: string): Promise<void> {
    try {
      await this.categories.delete(id, userId);
    } catch (error) {
      if (isPrismaError(error, 'P2025')) throw new NotFoundException(NOT_FOUND);
      if (isPrismaError(error, 'P2003')) {
        throw new ConflictException('Категория используется в расходах или транзакциях');
      }
      throw error;
    }
  }
}

function isPrismaError(error: unknown, code: string): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}
