import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
} from "class-validator";

export class CreateInstitutionDto {
  @ApiProperty({ maxLength: 150 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @ApiProperty({ description: "ID do estado (IBGE)" })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  stateId: number;

  @ApiProperty({ description: "ID da cidade (IBGE)" })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cityId: number;
}
