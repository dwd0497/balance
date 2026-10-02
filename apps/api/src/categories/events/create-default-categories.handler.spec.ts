import { UserRegisteredEvent } from '../../users/contracts';
import type { CategoriesRepository } from '../categories.repository';
import { DEFAULT_CATEGORIES } from '../default-categories';
import { CreateDefaultCategoriesHandler } from './create-default-categories.handler';

describe('CreateDefaultCategoriesHandler', () => {
  const categories = { createMany: jest.fn() };
  const handler = new CreateDefaultCategoriesHandler(categories as unknown as CategoriesRepository);

  beforeEach(() => jest.resetAllMocks());

  it('создаёт базовые категории новому пользователю', async () => {
    await handler.handle(new UserRegisteredEvent('user-1'));

    expect(categories.createMany).toHaveBeenCalledWith('user-1', DEFAULT_CATEGORIES);
  });

  it('не пробрасывает ошибку дальше', async () => {
    categories.createMany.mockRejectedValueOnce(new Error('db down'));
    jest.spyOn(handler['logger'], 'error').mockImplementation();

    await expect(handler.handle(new UserRegisteredEvent('user-1'))).resolves.toBeUndefined();
  });
});
