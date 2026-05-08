import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { validate } from "@shared/infra/config/env.validation";
import { GlobalExceptionFilter } from "@shared/infra/filters/global-exception.filter";
import { TransformInterceptor } from "@shared/infra/interceptors/transform.interceptor";
import { SharedModule } from "@shared/shared.module";
import { LocationModule } from "./modules/location/location.module";
import { UsersModule } from "./modules/users/users.module";
import { AuthModule } from "./modules/auth/auth.module";
import { InstitutionsModule } from "./modules/institutions/institutions.module";
import { CanteensModule } from "./modules/canteens/canteens.module";
import { CategoriesModule } from "./modules/categories/categories.module";
import { ProductsModule } from "./modules/products/products.module";
import { ExtrasModule } from "./modules/extras/extras.module";
import { CartModule } from "./modules/cart/cart.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { ReportsModule } from "./modules/reports/reports.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: process.env.NODE_ENV === "production",
      envFilePath: `envs/.env.${process.env.NODE_ENV || "development"}`,
      validate,
    }),
    ThrottlerModule.forRoot({ throttlers: [{ ttl: 60_000, limit: 30 }] }),
    SharedModule,
    LocationModule,
    UsersModule,
    AuthModule,
    InstitutionsModule,
    CanteensModule,
    CategoriesModule,
    ProductsModule,
    ExtrasModule,
    CartModule,
    OrdersModule,
    ReportsModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
