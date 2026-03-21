import { City } from "../models/city";

export const CITY_REPOSITORY = Symbol("CITY_REPOSITORY");

export interface CityRepository {
  findByStateId(stateId: number): Promise<City[]>;
}
