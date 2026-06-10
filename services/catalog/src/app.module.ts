import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { SharedModule } from "@shared/shared.module";
import { StatelessAuthModule } from "@shared/infra/auth/stateless-auth.module";
import { validate } from "./config/env.validation";
import { CanteensModule } from "./modules/canteens/canteens.module";
import { CategoriesModule } from "./modules/categories/categories.module";
import { ProductsModule } from "./modules/products/products.module";
import { ExtrasModule } from "./modules/extras/extras.module";

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
    CanteensModule,
    CategoriesModule,
    ProductsModule,
    ExtrasModule,
  ],
})
export class AppModule {}
