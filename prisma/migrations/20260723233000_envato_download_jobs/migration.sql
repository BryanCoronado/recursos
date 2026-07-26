-- CreateEnum
CREATE TABLE IF NOT EXISTS `_prisma_migrations_placeholder` (`id` INTEGER NOT NULL);

DROP TABLE IF EXISTS `_prisma_migrations_placeholder`;

CREATE TABLE `ProviderSession` (
    `id` VARCHAR(191) NOT NULL,
    `provider` ENUM('ENVATO', 'MAGNIFIC') NOT NULL,
    `status` ENUM('DISCONNECTED', 'SYNCING', 'READY', 'EXPIRED') NOT NULL DEFAULT 'DISCONNECTED',
    `profilePath` VARCHAR(191) NOT NULL,
    `lastSyncedAt` DATETIME(3) NULL,
    `lastError` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `ProviderSession_provider_key`(`provider`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `DownloadJob` (
    `id` VARCHAR(191) NOT NULL,
    `provider` ENUM('ENVATO', 'MAGNIFIC') NOT NULL,
    `url` TEXT NOT NULL,
    `status` ENUM('QUEUED', 'RUNNING', 'DONE', 'FAILED') NOT NULL DEFAULT 'QUEUED',
    `category` VARCHAR(191) NULL,
    `filePath` VARCHAR(191) NULL,
    `fileName` VARCHAR(191) NULL,
    `error` TEXT NULL,
    `requestedById` VARCHAR(191) NOT NULL,
    `startedAt` DATETIME(3) NULL,
    `finishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    INDEX `DownloadJob_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `DownloadJob_provider_status_idx`(`provider`, `status`),
    INDEX `DownloadJob_requestedById_idx`(`requestedById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AutomationRule` (
    `id` VARCHAR(191) NOT NULL,
    `provider` ENUM('ENVATO', 'MAGNIFIC') NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `priority` INTEGER NOT NULL DEFAULT 100,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `steps` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    INDEX `AutomationRule_provider_category_isActive_priority_idx`(`provider`, `category`, `isActive`, `priority`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `DownloadJob` ADD CONSTRAINT `DownloadJob_requestedById_fkey` FOREIGN KEY (`requestedById`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
