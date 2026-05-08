import { Module } from "@nestjs/common";
import { SharedModule } from "@shared/shared.module";
import { ProductsModule } from "../products/products.module";
import { CART_REPOSITORY } from "./domain/repositories/cart.repository";
import { DrizzleCartRepository } from "./infra/repositories/drizzle-cart.repository";
import { CartService } from "./application/services/cart.service";
import { CartController } from "./infra/controllers/cart.controller";

@Module({
  imports: [SharedModule, ProductsModule],
  controllers: [CartController],
  providers: [
    CartService,
    DrizzleCartRepository,
    { provide: CART_REPOSITORY, useExisting: DrizzleCartRepository },
  ],
  exports: [CART_REPOSITORY],
})
export class CartModule {}
