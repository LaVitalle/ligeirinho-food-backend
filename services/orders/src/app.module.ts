import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { SharedModule } from "@shared/shared.module";
import { StatelessAuthModule } from "@shared/infra/auth/stateless-auth.module";
import { validate } from "./config/env.validation";
import { CartModule } from "./modules/cart/cart.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { PaymentMethodsModule } from "./modules/payment-methods/payment-methods.module";
import { ProjectionsModule } from "./modules/projections/projections.module";
import { ReportsModule } from "./modules/reports/reports.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: process.env.NODE_ENV === "production",
      envFilePath: ".env",
      validate,
    }),
    SharedModule,
    StatelessAuthModule,
    ProjectionsModule,
    CartModule,
    PaymentMethodsModule,
    OrdersModule,
    ReportsModule,
  ],
})
export class AppModule {}
