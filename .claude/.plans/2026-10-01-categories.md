# Модуль категорий трат (`categories`)

## Context
Авторизация готова, следующий шаг — пользовательские категории расходов. Сейчас `Category` в `schema.prisma` глобальная (`name @unique`, enum `kind`, заполняется `prisma/seed.ts`). Нужно сделать категорию собственностью пользователя: `id`, `name`, `color`, `userId`, а также CRUD-API под глобальным `JwtAuthGuard` с zod-валидацией.

Решения пользователя: поле `kind` (и enum `CategoryKind`) удаляем; глобальный seed убираем, вместо него при регистрации пользователю создаётся набор базовых категорий (через `UserRegisteredEvent`).

## 1. Prisma (`apps/api/prisma/schema.prisma`)
- Удалить `enum CategoryKind`.
- `Category`:
  ```prisma
  model Category {
    id        String    @id @default(uuid()) @db.Uuid
    userId    String    @db.Uuid
    user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
    name      String
    /// HEX-цвет `#rrggbb`, нижний регистр.
    color     String    @db.Char(7)
    expenses  Expense[]
    createdAt DateTime  @default(now())
    updatedAt DateTime  @updatedAt

    @@unique([userId, name])
    @@map("categories")
  }
  ```
  (`@@unique([userId, name])` даёт и индекс по `userId`.)
- `User`: добавить `categories Category[]`.
- Миграция: `npm run prisma:migrate -w @balance/api -- --create-only --name user_categories`, затем в начало SQL вручную добавить `DELETE FROM "categories";` (глобальные строки без `userId`, иначе `NOT NULL` упадёт). Таблица `expenses` пока не используется API — перед применением проверить, что она пуста (FK `Restrict`). Затем применить `prisma:migrate`.

## 2. Seed
Удалить `apps/api/prisma/seed.ts`, `migrations.seed` в `apps/api/prisma.config.ts`, скрипт `prisma:seed` в `apps/api/package.json`; поправить строки про seed и `CategoryKind` в `CLAUDE.md`.

## 3. Shared (`packages/shared`)
- Новый `src/categories.ts` (+ `export * from './categories'` в `src/index.ts`):
  - `HexColor = z.string().trim().toLowerCase().regex(/^#[0-9a-f]{6}$/, 'Цвет в формате #RRGGBB')`
  - `CategoryName = z.string().trim().min(1).max(100)`
  - `CategorySchema = { id: uuid, name, color, createdAt: iso.datetime, updatedAt: iso.datetime }` → `type Category` (`userId` наружу не отдаём — всегда текущий пользователь).
  - `CreateCategorySchema = { name, color }` → `CreateCategoryInput`
  - `UpdateCategorySchema = CreateCategorySchema.partial()` → `UpdateCategoryInput`
- Из `src/schemas.ts` убрать старый `CategorySchema`, из `src/enums.ts` — `CategoryKind`.
- `npm run build -w @balance/shared`.

## 4. API: `apps/api/src/categories/`
Структура по образцу `src/users` и `src/auth` (внутри модуля — сервис, межмодульно — только шины/contracts):

- `categories.repository.ts` — `CategoriesRepository` поверх `PrismaService`:
  `findAllByUser(userId)` (сортировка по `name`), `findOne(id, userId)` (`findFirst`), `create(userId, data)`, `update(id, userId, data)` / `delete(id, userId)` через `where: { id, userId }` (Prisma бросит `P2025`, если чужая/нет), `createMany(userId, items)` с `skipDuplicates`.
- `categories.mapper.ts` — `toCategory(row): Category` (даты → ISO).
- `categories.service.ts` — `CategoriesService`:
  - `findAll(userId)`; `findOne(userId, id)` → `NotFoundException`;
  - `create(userId, dto)` — `P2002` → `ConflictException('Категория с таким названием уже существует')`;
  - `update(userId, id, dto)` — `P2025` → 404, `P2002` → 409;
  - `remove(userId, id)` — `P2025` → 404, `P2003` (есть расходы, FK Restrict) → 409 «Категория используется в расходах».
  Обработка ошибок Prisma — как в `users/commands/create-user.handler.ts` (`Prisma.PrismaClientKnownRequestError`).
- `categories.dto.ts` — `createZodDto`: `CreateCategoryDto`, `UpdateCategoryDto`, `CategoryDto` (как `auth/auth.dto.ts`).
- `categories.controller.ts` — `@ApiTags('categories') @ApiCookieAuth() @Controller('categories')`, без `@Public()` → закрыт глобальным `JwtAuthGuard`; пользователь — `@CurrentUser() user: AuthUser` из `../auth/contracts`; `:id` через `ParseUUIDPipe`:
  - `GET /categories` — все категории пользователя
  - `GET /categories/:id`
  - `POST /categories` → 201
  - `PATCH /categories/:id`
  - `DELETE /categories/:id` → 204
- `default-categories.ts` — базовый набор (`Черновые материалы`, `Чистовые материалы`, `Работы`, `Мебель`, `Техника`, `Прочее`) с цветами.
- `events/create-default-categories.handler.ts` — `@EventsHandler(UserRegisteredEvent)` (импорт из `../../users/contracts`), вызывает `createMany` с дефолтами; ошибки логирует через `Logger`, не роняя регистрацию.
- `categories.module.ts` — `controllers: [CategoriesController]`, `providers: [CategoriesRepository, CategoriesService, CreateDefaultCategoriesHandler]`, ничего не экспортирует. Подключить в `src/app.module.ts`.

## 5. Тесты (Jest, рядом с кодом)
- `categories.service.spec.ts` — мок репозитория: маппинг, 404 на чужую/несуществующую, 409 на дубликат имени, 409 на удаление используемой.
- `events/create-default-categories.handler.spec.ts` — создаёт дефолты для `userId`.

## Проверка
1. `npm run db:up`, миграция применена, `npm run prisma:generate -w @balance/api`.
2. `npm run typecheck && npm run lint && npm run test`.
3. `npm run dev`, затем вручную (curl с cookie-jar или Swagger `/docs`):
   - регистрация → `GET /categories` возвращает 6 дефолтных;
   - без cookie → 401;
   - `POST` с `color: "red"` → 400; дубликат имени → 409;
   - `PATCH`/`DELETE` категории другого пользователя → 404; `DELETE` своей → 204.
