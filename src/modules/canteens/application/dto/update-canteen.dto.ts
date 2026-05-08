import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateCanteenDto {
  @ApiPropertyOptional({ example: "Cantina Renovada" })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({ example: "12.345.678/0001-99" })
  @IsOptional()
  @IsString()
  @MaxLength(18)
  cnpj?: string;

  @ApiPropertyOptional({ example: "Bloco B" })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  block?: string;

  @ApiPropertyOptional({ example: "Sala 202" })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  room?: string;
}
