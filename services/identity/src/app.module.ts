import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { SharedModule } from "@shared/shared.module";
import { validate } from "./config/env.validation";
import { AuthModule } from "./modules/auth/auth.module";
import { InstitutionsModule } from "./modules/institutions/institutions.module";
import { IntegrationModule } from "./modules/integration/integration.module";
import { LocationModule } from "./modules/location/location.module";
import { UsersModule } from "./modules/users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: process.env.NODE_ENV === "production",
      envFilePath: ".env",
      validate,
    }),
    ThrottlerModule.forRoot({ throttlers: [{ ttl: 60_000, limit: 30 }] }),
    SharedModule,
    LocationModule,
    UsersModule,
    AuthModule,
    InstitutionsModule,
    IntegrationModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
