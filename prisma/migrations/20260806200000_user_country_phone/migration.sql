-- AlterTable
ALTER TABLE `User` ADD COLUMN `country` VARCHAR(191) NULL,
    ADD COLUMN `phone` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `User_phone_idx` ON `User`(`phone`);
