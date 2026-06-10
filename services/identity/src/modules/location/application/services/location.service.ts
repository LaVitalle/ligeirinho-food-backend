import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  CITY_REPOSITORY,
  CityRepository,
} from "../../domain/repositories/city.repository";
import {
  STATE_REPOSITORY,
  StateRepository,
} from "../../domain/repositories/state.repository";
import { CityDto } from "../dto/city.dto";
import { StateDto } from "../dto/state.dto";

@Injectable()
export class LocationService {
  constructor(
    @Inject(STATE_REPOSITORY)
    private readonly stateRepository: StateRepository,
    @Inject(CITY_REPOSITORY)
    private readonly cityRepository: CityRepository,
  ) {}

  async findAllStates(): Promise<StateDto[]> {
    const states = await this.stateRepository.findAll();
    return states.map((s) => StateDto.from(s)!);
  }

  async findCitiesByStateId(stateId: number): Promise<CityDto[]> {
    const cities = await this.cityRepository.findByStateId(stateId);

    if (cities.length === 0) {
      throw new NotFoundException(
        "Nenhuma cidade encontrada para o estado informado",
      );
    }

    return cities.map((c) => CityDto.from(c)!);
  }
}
