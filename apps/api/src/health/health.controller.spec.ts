import { ServiceUnavailableException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  const prisma = { $queryRaw: jest.fn() };
  let controller: HealthController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: prisma }],
    }).compile();

    controller = moduleRef.get(HealthController);
  });

  it('возвращает ok, когда БД доступна', async () => {
    prisma.$queryRaw.mockResolvedValueOnce([{ '?column?': 1 }]);
    await expect(controller.check()).resolves.toEqual({ status: 'ok', db: 'up' });
  });

  it('бросает 503, когда БД недоступна', async () => {
    prisma.$queryRaw.mockRejectedValueOnce(new Error('connection refused'));
    await expect(controller.check()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
