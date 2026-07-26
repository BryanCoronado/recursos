-- AlterTable
ALTER TABLE `AutomationRule` ADD COLUMN `urlPattern` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `AutomationRecording` (
    `id` VARCHAR(191) NOT NULL,
    `provider` ENUM('ENVATO', 'MAGNIFIC') NOT NULL,
    `status` ENUM('IDLE', 'RECORDING', 'STOPPED') NOT NULL DEFAULT 'IDLE',
    `name` VARCHAR(191) NULL,
    `sampleUrl` TEXT NULL,
    `urlPattern` VARCHAR(191) NULL,
    `category` VARCHAR(191) NOT NULL DEFAULT 'default',
    `priority` INTEGER NOT NULL DEFAULT 50,
    `steps` JSON NOT NULL DEFAULT ('[]'),
    `nextClickIsDownload` BOOLEAN NOT NULL DEFAULT false,
    `lastError` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AutomationRecording_provider_key`(`provider`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `AutomationRule_provider_isActive_priority_idx` ON `AutomationRule`(`provider`, `isActive`, `priority`);
