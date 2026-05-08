import { Module } from "@nestjs/common";
import { SharedModule } from "@shared/shared.module";
import { EXTRA_REPOSITORY } from "./domain/repositories/extra.repository";
import { DrizzleExtraRepository } from "./infra/repositories/drizzle-extra.repository";
import { ExtraService } from "./application/services/extra.service";
import { ExtraController } from "./infra/controllers/extra.controller";

@Module({
  imports: [SharedModule],
  controllers: [ExtraController],
  providers: [
    ExtraService,
    DrizzleExtraRepository,
    { provide: EXTRA_REPOSITORY, useExisting: DrizzleExtraRepository },
  ],
  exports: [EXTRA_REPOSITORY],
})
export class ExtrasModule {}
