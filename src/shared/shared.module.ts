import { Module } from "@nestjs/common";
import { DrizzleService } from "./infra/database/drizzle.service";
import { ErrorLogRepository } from "./infra/repositories/error-log.repository";
import { MinioService } from "./infra/storage/minio.service";

@Module({
  providers: [DrizzleService, MinioService, ErrorLogRepository],
  exports: [DrizzleService, MinioService, ErrorLogRepository],
})
export class SharedModule {}
