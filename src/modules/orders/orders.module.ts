import { Module } from "@nestjs/common";
import { SharedModule } from "@shared/shared.module";
import { CartModule } from "../cart/cart.module";
import { CanteensModule } from "../canteens/canteens.module";
import { ORDER_REPOSITORY } from "./domain/repositories/order.repository";
import { DrizzleOrderRepository } from "./infra/repositories/drizzle-order.repository";
import { OrderService } from "./application/services/order.service";
import { OrderController } from "./infra/controllers/order.controller";

@Module({
  imports: [SharedModule, CartModule, CanteensModule],
  controllers: [OrderController],
  providers: [
    OrderService,
    DrizzleOrderRepository,
    { provide: ORDER_REPOSITORY, useExisting: DrizzleOrderRepository },
  ],
  exports: [ORDER_REPOSITORY],
})
export class OrdersModule {}
