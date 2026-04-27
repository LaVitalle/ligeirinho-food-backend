import { Module } from "@nestjs/common";
import { SharedModule } from "@shared/shared.module";
import { InstitutionService } from "./application/services/institution.service";
import { INSTITUTION_REPOSITORY } from "./domain/repositories/institution.repository";
import { InstitutionController } from "./infra/controllers/institution.controller";
import { DrizzleInstitutionRepository } from "./infra/repositories/drizzle-institution.repository";

@Module({
  imports: [SharedModule],
  controllers: [InstitutionController],
  providers: [
    InstitutionService,
    DrizzleInstitutionRepository,
    {
      provide: INSTITUTION_REPOSITORY,
      useExisting: DrizzleInstitutionRepository,
    },
  ],
  exports: [InstitutionService],
})
export class InstitutionsModule {}
