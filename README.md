# Balance — трекер расходов на ремонт квартиры

Монорепозиторий на npm workspaces.

| Пакет             | Путь              | Стек                                                                                                |
| ----------------- | ----------------- | --------------------------------------------------------------------------------------------------- |
| `@balance/web`    | `apps/web`        | Next.js 16 (App Router), React 19, Tailwind CSS 4, shadcn/ui, TanStack Query, react-hook-form + zod |
| `@balance/api`    | `apps/api`        | NestJS 11, Prisma 7 + PostgreSQL 17, nestjs-zod, Swagger                                            |
| `@balance/shared` | `packages/shared` | zod-схемы и типы контрактов API                                                                     |

## Требования

- Node.js 22 LTS (`nvm use` — версия указана в `.nvmrc`)
- Docker (для PostgreSQL)

## Первый запуск

```bash
nvm install && nvm use
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

npm install                                # также выполнит prisma generate
npm run db:up                              # поднять PostgreSQL
npm run prisma:migrate -w @balance/api     # создать первую миграцию
npm run prisma:seed -w @balance/api        # базовые категории расходов
npm run dev                                # shared (watch) + api + web
```

- Web: http://localhost:3000
- API: http://localhost:3001, healthcheck — `/health`, Swagger — `/docs`

## Скрипты

| Команда                               | Что делает                 |
| ------------------------------------- | -------------------------- |
| `npm run dev`                         | dev-режим всех приложений  |
| `npm run build`                       | сборка shared → api → web  |
| `npm run lint` / `typecheck` / `test` | проверки во всех workspace |
| `npm run format`                      | Prettier                   |
| `npm run db:up` / `db:down`           | PostgreSQL в Docker        |

## shadcn/ui

Компоненты добавляются в `apps/web/src/components/ui`:

```bash
cd apps/web && npx shadcn@latest add button card input table
```
