# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Трекер расходов на ремонт квартиры. Монорепозиторий на **npm workspaces** (не pnpm/turbo), Node 22 LTS (`.nvmrc`). Общение с пользователем — на русском.

## Команды

Из корня:

```bash
npm run dev          # собирает @balance/shared, затем concurrently: shared (tsc --watch) + api + web
npm run build        # строго по порядку: shared → api → web
npm run lint | typecheck | test   # по всем workspace (--if-present)
npm run format       # Prettier
npm run db:up        # PostgreSQL 17 в Docker (docker-compose.yml, креды из корневого .env)
```

Команды конкретного пакета — через `-w`:

```bash
npm run test -w @balance/api -- src/health/health.controller.spec.ts   # один тест-файл
npm run test -w @balance/api -- -t 'возвращает ok'                     # один тест по имени
npm run prisma:migrate -w @balance/api      # prisma migrate dev (создать/применить миграцию); клиент НЕ перегенерирует — после него prisma:generate
npm run prisma:generate -w @balance/api
cd apps/web && npx shadcn@latest add <component>   # компоненты в src/shared/ui; CLI ошибочно ставит npm-пакет `cn` и пишет `import { cn } from "cn"` — заменить на `@/shared/lib/utils` и `npm uninstall cn -w @balance/web`
```

Env-файлы: корневой `.env` (только `POSTGRES_*` для docker compose), `apps/api/.env` (`DATABASE_URL`, `PORT=3001`, `CORS_ORIGIN`, `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` — разные, ≥ 32 символов, иначе API не стартует), `apps/web/.env.local` (`NEXT_PUBLIC_API_URL`). Шаблоны — `*.env.example`.

## Архитектура

- **`packages/shared`** (`@balance/shared`) — zod-схемы (zod v4) и выведенные типы контрактов API (`Project`, `Room`, `Category`, `Expense`, `Create*/Update*`). Собирается `tsc` в `dist/` (CommonJS) — api и web импортируют **собранный** `dist`, поэтому после правок shared нужен `build` (в `npm run dev` работает watch). Новые контракты API определять здесь и использовать на обеих сторонах.
- **`apps/api`** (`@balance/api`) — NestJS 11, CommonJS, `module: nodenext`.
  - Валидация: глобальный `ZodValidationPipe` из `nestjs-zod` (`APP_PIPE` в `app.module.ts`); DTO строить через `createZodDto` из схем shared, а не class-validator.
  - Конфиг: `ConfigModule` с zod-валидацией env (`src/config.ts`), доступ через `ConfigService<Env, true>`.
  - Prisma 7: URL БД задаётся в `prisma.config.ts` (не в `schema.prisma`); генератор `prisma-client` с `moduleFormat = "cjs"` пишет клиент в `src/generated/prisma` (в .gitignore, генерируется на `postinstall`/`prebuild`). Импорт: `../generated/prisma/client`. Подключение — через driver adapter `@prisma/adapter-pg` в `PrismaService` (глобальный `PrismaModule`).
  - Swagger на `/docs`, healthcheck `GET /health` (проверяет БД). Тесты — Jest + ts-jest, файлы `*.spec.ts` рядом с кодом; сгенерированный Prisma-клиент импортирует `*.js`, поэтому в jest-конфиге есть `moduleNameMapper`, срезающий `.js`.
  - **CQRS между модулями** (`@nestjs/cqrs` v11, `CqrsModule.forRoot()` в `AppModule`): модули не экспортируют провайдеры и не импортируют друг друга. Межмодульные вызовы — только через `CommandBus`/`QueryBus`/`EventBus`; из чужого модуля импортировать можно лишь `src/<module>/contracts` (классы команд/запросов/событий, read-модели). Внутри модуля — `commands/`, `queries/`, `events/`, handler рядом с классом, handlers регистрируются в `providers`. Команды/запросы наследуют `Command<R>`/`Query<R>`, чтобы `execute()` был типизирован. Эталон — `src/users`.
  - **Авторизация** (`src/auth`): глобальный `JwtAuthGuard` (`APP_GUARD`) — всё закрыто по умолчанию, открывать через `@Public()`; текущий пользователь — `@CurrentUser(): AuthUser` (`{ userId, sessionId }`), оба из `auth/contracts`. Access/refresh JWT в httpOnly-cookie (`access_token` на `/`, `refresh_token` только на `/auth`); guard кроме подписи проверяет, что сессия в таблице `sessions` не отозвана. Refresh ротируется, повторное использование старого refresh отзывает все сессии пользователя. Пароли — argon2id (`PasswordService`), хеширование в auth, users получает готовый хеш.
- **`apps/web`** (`@balance/web`) — Next.js 16 App Router, React 19, Tailwind CSS 4 (CSS-first, без `tailwind.config`; тема — CSS-переменные в `src/app/globals.css`), shadcn/ui (стиль new-york). Данные — TanStack Query, формы — react-hook-form + `zodResolver` со схемами из shared (поля формы сверх контракта, например `confirmPassword`, — расширением схемы в `model/` фичи). Алиас `@/*` → `src/*`. Архитектура — **Feature-Sliced Design**, см. ниже.

### FSD во фронтенде (`apps/web/src`)

Слои сверху вниз; слой импортирует только из слоёв **ниже себя**, слайсы одного слоя друг друга не импортируют, снаружи слайс доступен **только через его `index.ts`** (public API):

- **`app/`** — одновременно роутинг Next и FSD-слой app. `page.tsx`/`layout.tsx` тонкие: реэкспорт view + `metadata`. Приватные папки (`_providers` — QueryClient, глобальный `onError` на 401, Toaster; `_guards` — `AuthGuard`/`GuestGuard`). Route groups: `(guest)` — логин/регистрация, `(protected)` — всё за авторизацией, с `AppHeader`.
- **`views/`** — слой pages (переименован: `pages` конфликтует с Pages Router Next). Одна папка — одна страница (`views/profile`), компонует виджеты и фичи.
- **`widgets/`** — крупные самостоятельные блоки UI (`app-header`).
- **`features/`** — пользовательские действия; сгруппированы по домену (`features/auth/login`, `…/register`, `…/logout`, `…/change-password`). Сегменты слайса: `api/` (вызовы `apiFetch`), `model/` (схемы форм, хуки), `ui/`.
- **`entities/`** — бизнес-сущности (`entities/user`: `getMe`, `userKeys`, `useCurrentUser`, `UserAvatar`). Query keys сущности живут здесь.
- **`shared/`** — без бизнес-логики: `ui/` (shadcn-компоненты, импорт напрямую `@/shared/ui/button`), `api/` (`apiFetch`, `ApiError`, `isApiError`, `getApiErrorMessage`), `lib/utils.ts` (`cn`, `formatMoney`), `config/` (`routes`, `safeNext`/`withNext` для `?next=`).

Авторизация на клиенте: источник истины — `useCurrentUser()` (`GET /auth/me`, `null` = не вошёл). `apiFetch` (`credentials: 'include'`) при 401 сам делает один общий `POST /auth/refresh` и повторяет запрос; если refresh не удался — 401 уходит в `QueryCache.onError`, который обнуляет пользователя, и `AuthGuard` редиректит на `/login?next=<путь>`. Гарды клиентские (не `proxy.ts`): cookie ставит API на своём origin, web-сервер их надёжно не видит. После логина/регистрации фича только кладёт пользователя в кеш — редирект делает `GuestGuard`; выход — `window.location.replace('/login')` для полного сброса кеша.

## Доменные соглашения

- Модель: `User` → `Session`, `Project` (владелец — `ownerId`, данные проектов фильтровать по текущему пользователю); `Project` (квартира, бюджет, валюта RUB) → `Room`, `Expense`; `User` → `Category` (имя + HEX-цвет, уникальна в пределах пользователя; базовый набор создаётся при регистрации по `UserRegisteredEvent`); `Expense` → `Category`, статус `PLANNED`/`PAID`; `User` → `Transaction` → `Category` (операция пользователя: `amount` > 0, `type` `INCOME`/`EXPENSE`, `date` без времени; категория подключается через `connect { id, userId }`, так что чужая категория → 404; категорию с операциями удалить нельзя — 409). API `/transactions`: CRUD + фильтры `type`/`categoryId`/`from`/`to` и `GET /transactions/summary` (income/expense/balance).
- Деньги — `Decimal(12,2)` в БД и **строка** в API (схема `Money` в shared), чтобы не терять точность; форматирование на фронте — `formatMoney` из `apps/web/src/shared/lib/utils.ts`.
- Имена таблиц — lowercase во множественном числе через `@@map` (`expenses`), колонки — camelCase как в моделях.

## Линтинг

Корневой `eslint.config.mjs` (typescript-eslint + prettier) покрывает api и shared; `apps/web` игнорируется корнем и имеет свой конфиг на `eslint-config-next`.
