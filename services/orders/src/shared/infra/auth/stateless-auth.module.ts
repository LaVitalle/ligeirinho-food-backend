import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { RolesGuard } from "@shared/infra/guards/roles.guard";
import { StatelessJwtAuthGuard } from "./stateless-jwt-auth.guard";

/**
 * Auth para serviços que NÃO são donos da tabela de usuários (catalog/orders).
 * Registra globalmente a verificação stateless do JWT + o RolesGuard.
 * Basta importar este módulo no AppModule do serviço.
 */
@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>("JWT_SECRET"),
      }),
    }),
  ],
  providers: [
    { provide: APP_GUARD, useClass: StatelessJwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [JwtModule],
})
export class StatelessAuthModule {}
