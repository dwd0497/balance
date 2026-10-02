import { z } from 'zod';

/** HEX-цвет `#rrggbb`, приводится к нижнему регистру. */
export const HexColor = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^#[0-9a-f]{6}$/, 'Цвет в формате #RRGGBB');

const CategoryName = z.string().trim().min(1).max(100);

export const CategorySchema = z.object({
  id: z.uuid(),
  name: CategoryName,
  color: HexColor,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Category = z.infer<typeof CategorySchema>;

export const CreateCategorySchema = z.object({
  name: CategoryName,
  color: HexColor,
});
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;

export const UpdateCategorySchema = CreateCategorySchema.partial();
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
