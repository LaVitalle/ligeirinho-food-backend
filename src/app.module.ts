import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { validate } from "@shared/infra/config/env.validation";
import { GlobalExceptionFilter } from "@shared/infra/filters/global-exception.filter";
import { TransformInterceptor } from "@shared/infra/interceptors/transform.interceptor";
import { SharedModule } from "@shared/shared.module";
import { LocationModule } from "./modules/location/location.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: process.env.NODE_ENV === "production",
      envFilePath: `envs/.env.${process.env.NODE_ENV || "development"}`,
      validate,
    }),
    SharedModule,
    LocationModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
  ],
})
export class AppModule {}
