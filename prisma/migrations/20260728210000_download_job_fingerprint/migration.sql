-- AlterTable
ALTER TABLE `DownloadJob` ADD COLUMN `deviceKey` VARCHAR(191) NULL,
    ADD COLUMN `clientIp` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `DownloadJob_provider_deviceKey_idx` ON `DownloadJob`(`provider`, `deviceKey`);

-- CreateIndex
CREATE INDEX `DownloadJob_provider_clientIp_idx` ON `DownloadJob`(`provider`, `clientIp`);
