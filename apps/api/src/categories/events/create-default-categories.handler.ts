import { Logger } from '@nestjs/common';
import { EventsHandler, type IEventHandler } from '@nestjs/cqrs';
import { UserRegisteredEvent } from '../../users/contracts';
import { CategoriesRepository } from '../categories.repository';
import { DEFAULT_CATEGORIES } from '../default-categories';

/** Выдаёт новому пользователю базовые категории. Сбой не должен ломать регистрацию. */
@EventsHandler(UserRegisteredEvent)
export class CreateDefaultCategoriesHandler implements IEventHandler<UserRegisteredEvent> {
  private readonly logger = new Logger(CreateDefaultCategoriesHandler.name);

  constructor(private readonly categories: CategoriesRepository) {}

  async handle({ userId }: UserRegisteredEvent): Promise<void> {
    try {
      await this.categories.createMany(userId, [...DEFAULT_CATEGORIES]);
    } catch (error) {
      this.logger.error(`Не удалось создать базовые категории для ${userId}`, error);
    }
  }
}
