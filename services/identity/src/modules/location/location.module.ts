import { Module } from "@nestjs/common";
import { SharedModule } from "@shared/shared.module";
import { LocationService } from "./application/services/location.service";
import { CITY_REPOSITORY } from "./domain/repositories/city.repository";
import { STATE_REPOSITORY } from "./domain/repositories/state.repository";
import { CitiesController } from "./infra/controllers/cities.controller";
import { StatesController } from "./infra/controllers/states.controller";
import { DrizzleCityRepository } from "./infra/repositories/drizzle-city.repository";
import { DrizzleStateRepository } from "./infra/repositories/drizzle-state.repository";

@Module({
  imports: [SharedModule],
  controllers: [StatesController, CitiesController],
  providers: [
    LocationService,
    DrizzleStateRepository,
    DrizzleCityRepository,
    { provide: STATE_REPOSITORY, useExisting: DrizzleStateRepository },
    { provide: CITY_REPOSITORY, useExisting: DrizzleCityRepository },
  ],
})
export class LocationModule {}
