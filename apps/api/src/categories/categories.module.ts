import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesRepository } from './categories.repository';
import { CategoriesService } from './categories.service';
import { CreateDefaultCategoriesHandler } from './events/create-default-categories.handler';

/** Ничего не экспортирует; с users связан только через EventBus (`users/contracts`). */
@Module({
  controllers: [CategoriesController],
  providers: [CategoriesRepository, CategoriesService, CreateDefaultCategoriesHandler],
})
export class CategoriesModule {}
