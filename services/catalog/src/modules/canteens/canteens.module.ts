import { Module } from "@nestjs/common";
import { SharedModule } from "@shared/shared.module";
import { StorageModule } from "@shared/infra/storage/storage.module";
import { CANTEEN_REPOSITORY } from "./domain/repositories/canteen.repository";
import { DrizzleCanteenRepository } from "./infra/repositories/drizzle-canteen.repository";
import { CanteenService } from "./application/services/canteen.service";
import { CanteenMessagingService } from "./application/services/canteen-messaging.service";
import { SellerMessageConsumerService } from "./application/services/seller-message-consumer.service";
import { CanteenController } from "./infra/controllers/canteen.controller";

@Module({
  imports: [SharedModule, StorageModule],
  controllers: [CanteenController],
  providers: [
    CanteenService,
    CanteenMessagingService,
    SellerMessageConsumerService,
    DrizzleCanteenRepository,
    { provide: CANTEEN_REPOSITORY, useExisting: DrizzleCanteenRepository },
  ],
  exports: [CANTEEN_REPOSITORY],
})
export class CanteensModule {}
