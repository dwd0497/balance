import { CategorySchema, CreateCategorySchema, UpdateCategorySchema } from '@balance/shared';
import { createZodDto } from 'nestjs-zod';

export class CreateCategoryDto extends createZodDto(CreateCategorySchema) {}
export class UpdateCategoryDto extends createZodDto(UpdateCategorySchema) {}
export class CategoryDto extends createZodDto(CategorySchema) {}
