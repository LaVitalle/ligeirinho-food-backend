import { Module } from "@nestjs/common";
import { SharedModule } from "@shared/shared.module";
import { CartModule } from "../cart/cart.module";
import { ProjectionsModule } from "../projections/projections.module";
import { ORDER_REPOSITORY } from "./domain/repositories/order.repository";
import { DrizzleOrderRepository } from "./infra/repositories/drizzle-order.repository";
import { OrderService } from "./application/services/order.service";
import { OrderMessagingService } from "./application/services/order-messaging.service";
import { RatingService } from "./application/services/rating.service";
import { OrderController } from "./infra/controllers/order.controller";
import { RatingController } from "./infra/controllers/rating.controller";

@Module({
  imports: [SharedModule, CartModule, ProjectionsModule],
  controllers: [OrderController, RatingController],
  providers: [
    OrderService,
    OrderMessagingService,
    RatingService,
    DrizzleOrderRepository,
    { provide: ORDER_REPOSITORY, useExisting: DrizzleOrderRepository },
  ],
  exports: [ORDER_REPOSITORY],
})
export class OrdersModule {}
