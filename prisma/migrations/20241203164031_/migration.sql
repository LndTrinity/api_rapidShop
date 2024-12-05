/*
  Warnings:

  - The primary key for the `admins` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "produtos" DROP CONSTRAINT "produtos_adminId_fkey";

-- AlterTable
ALTER TABLE "admins" DROP CONSTRAINT "admins_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE VARCHAR(36),
ADD CONSTRAINT "admins_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "admins_id_seq";

-- AlterTable
ALTER TABLE "produtos" ALTER COLUMN "adminId" DROP DEFAULT,
ALTER COLUMN "adminId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
