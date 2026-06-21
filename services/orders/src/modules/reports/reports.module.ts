import { Module } from "@nestjs/common";
import { SharedModule } from "@shared/shared.module";
import { ReportService } from "./application/services/report.service";
import { ReportController } from "./infra/controllers/report.controller";

@Module({
  imports: [SharedModule],
  controllers: [ReportController],
  providers: [ReportService],
})
export class ReportsModule {}
