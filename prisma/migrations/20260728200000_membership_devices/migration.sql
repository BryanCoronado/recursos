-- AlterTable
ALTER TABLE `Membership` ADD COLUMN `maxDevices` INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE `MembershipDevice` (
    `id` VARCHAR(191) NOT NULL,
    `membershipId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `provider` ENUM('ENVATO', 'MAGNIFIC') NOT NULL,
    `deviceKey` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NULL,
    `userAgent` TEXT NULL,
    `lastSeenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `MembershipDevice_membershipId_idx`(`membershipId`),
    INDEX `MembershipDevice_userId_provider_idx`(`userId`, `provider`),
    UNIQUE INDEX `MembershipDevice_userId_provider_deviceKey_key`(`userId`, `provider`, `deviceKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MembershipDevice` ADD CONSTRAINT `MembershipDevice_membershipId_fkey` FOREIGN KEY (`membershipId`) REFERENCES `Membership`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MembershipDevice` ADD CONSTRAINT `MembershipDevice_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
