import { ApiProperty } from "@nestjs/swagger";
import { City } from "../../domain/models/city";

export class CityDto {
  @ApiProperty({ example: 3550308, description: "Codigo IBGE do municipio" })
  readonly id: number;

  @ApiProperty({ example: "Sao Paulo", description: "Nome do municipio" })
  readonly name: string;

  @ApiProperty({ example: 35, description: "Codigo IBGE do estado" })
  readonly stateId: number;

  constructor(id: number, name: string, stateId: number) {
    this.id = id;
    this.name = name;
    this.stateId = stateId;
  }

  static from(city: City | null): CityDto | null {
    if (!city) return null;
    return new CityDto(city.id, city.name, city.stateId);
  }
}
