import { Module } from "@nestjs/common";
import { SharedModule } from "@shared/shared.module";
import { PAYMENT_METHOD_REPOSITORY } from "./domain/repositories/payment-method.repository";
import { DrizzlePaymentMethodRepository } from "./infra/repositories/drizzle-payment-method.repository";
import { PaymentMethodService } from "./application/services/payment-method.service";
import { PaymentMethodController } from "./infra/controllers/payment-method.controller";

@Module({
  imports: [SharedModule],
  controllers: [PaymentMethodController],
  providers: [
    PaymentMethodService,
    DrizzlePaymentMethodRepository,
    {
      provide: PAYMENT_METHOD_REPOSITORY,
      useExisting: DrizzlePaymentMethodRepository,
    },
  ],
  exports: [PAYMENT_METHOD_REPOSITORY],
})
export class PaymentMethodsModule {}
