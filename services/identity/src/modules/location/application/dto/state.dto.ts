import { ApiProperty } from "@nestjs/swagger";
import { State } from "../../domain/models/state";

export class StateDto {
  @ApiProperty({ example: 35, description: "Codigo IBGE do estado" })
  readonly id: number;

  @ApiProperty({ example: "Sao Paulo", description: "Nome do estado" })
  readonly name: string;

  @ApiProperty({ example: "SP", description: "Sigla UF" })
  readonly abbreviation: string;

  constructor(id: number, name: string, abbreviation: string) {
    this.id = id;
    this.name = name;
    this.abbreviation = abbreviation;
  }

  static from(state: State | null): StateDto | null {
    if (!state) return null;
    return new StateDto(state.id, state.name, state.abbreviation);
  }
}
