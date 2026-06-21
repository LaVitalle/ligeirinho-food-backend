import { Module } from "@nestjs/common";
import { SharedModule } from "@shared/shared.module";
import { StorageModule } from "@shared/infra/storage/storage.module";
import { ICON_REPOSITORY } from "./domain/repositories/icon.repository";
import { DrizzleIconRepository } from "./infra/repositories/drizzle-icon.repository";
import { IconService } from "./application/services/icon.service";
import { IconController } from "./infra/controllers/icon.controller";

@Module({
  imports: [SharedModule, StorageModule],
  controllers: [IconController],
  providers: [
    IconService,
    DrizzleIconRepository,
    { provide: ICON_REPOSITORY, useExisting: DrizzleIconRepository },
  ],
  exports: [ICON_REPOSITORY],
})
export class IconsModule {}
