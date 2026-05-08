import { Module } from "@nestjs/common";
import { SharedModule } from "@shared/shared.module";
import { UsersModule } from "../users/users.module";
import { CANTEEN_REPOSITORY } from "./domain/repositories/canteen.repository";
import { DrizzleCanteenRepository } from "./infra/repositories/drizzle-canteen.repository";
import { CanteenService } from "./application/services/canteen.service";
import { CanteenController } from "./infra/controllers/canteen.controller";

@Module({
  imports: [SharedModule, UsersModule],
  controllers: [CanteenController],
  providers: [
    CanteenService,
    DrizzleCanteenRepository,
    { provide: CANTEEN_REPOSITORY, useExisting: DrizzleCanteenRepository },
  ],
  exports: [CANTEEN_REPOSITORY],
})
export class CanteensModule {}
