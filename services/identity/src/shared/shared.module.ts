import { Global, Module } from "@nestjs/common";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { DrizzleService } from "./infra/database/drizzle.service";
import { GlobalExceptionFilter } from "./infra/filters/global-exception.filter";
import { TransformInterceptor } from "./infra/interceptors/transform.interceptor";
import { RabbitMQService } from "./infra/messaging/rabbitmq.service";
import { SharedMessagingService } from "./infra/messaging/shared-messaging.service";
import { ErrorLogRepository } from "./infra/repositories/error-log.repository";

/**
 * Módulo compartilhado por todos os microsserviços de domínio.
 * Fornece infraestrutura transversal: banco, mensageria, envelope de resposta
 * (com HATEOAS), tratamento global de erros e persistência de logs.
 */
@Global()
@Module({
  providers: [
    DrizzleService,
    ErrorLogRepository,
    RabbitMQService,
    SharedMessagingService,
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
  ],
  exports: [
    DrizzleService,
    ErrorLogRepository,
    RabbitMQService,
    SharedMessagingService,
  ],
})
export class SharedModule {}
