import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { SharedModule } from "@shared/shared.module";
import { EmailModule } from "@shared/infra/email/email.module";
import { JwtAuthGuard } from "@shared/infra/guards/jwt-auth.guard";
import { RolesGuard } from "@shared/infra/guards/roles.guard";
import { UsersModule } from "../users/users.module";
import { AuthService } from "./application/services/auth.service";
import { PasswordRecoveryService } from "./application/services/password-recovery.service";
import { AuthController } from "./infra/controllers/auth.controller";
import { JwtStrategy } from "./infra/strategies/jwt.strategy";

@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("JWT_SECRET"),
        signOptions: { expiresIn: "1d" },
      }),
    }),
    SharedModule,
    UsersModule,
    EmailModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordRecoveryService,
    JwtStrategy,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AuthModule {}
