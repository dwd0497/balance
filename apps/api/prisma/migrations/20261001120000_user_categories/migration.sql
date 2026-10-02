-- Категории стали пользовательскими: глобальные строки из старого seed не к кому привязать.
DELETE FROM "categories";

-- DropIndex
DROP INDEX "categories_name_key";

-- AlterTable
ALTER TABLE "categories" DROP COLUMN "kind",
ADD COLUMN     "color" CHAR(7) NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "userId" UUID NOT NULL;

-- DropEnum
DROP TYPE "CategoryKind";

-- CreateIndex
CREATE UNIQUE INDEX "categories_userId_name_key" ON "categories"("userId", "name");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

