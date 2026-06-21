import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";
import { Extra } from "../../domain/models/extra";

export class CreateExtraDto {
  @ApiProperty() @IsUUID() canteenId: string;
  @ApiProperty({ example: "Queijo extra" }) @IsString() @IsNotEmpty() @MaxLength(150) name: string;
  @ApiProperty({ example: "3.50" }) @IsNumberString() price: string;
}

export class UpdateExtraDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(150) name?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumberString() price?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}

export class ExtraResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() canteenId: string;
  @ApiProperty() name: string;
  @ApiProperty() price: string;
  @ApiProperty() isActive: boolean;

  static from(extra: Extra): ExtraResponseDto {
    const dto = new ExtraResponseDto();
    dto.id = extra.id;
    dto.canteenId = extra.canteenId;
    dto.name = extra.name;
    dto.price = extra.price;
    dto.isActive = extra.isActive;
    return dto;
  }
}

export class AddExtrasToProductDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID("4", { each: true })
  extraIds: string[];
}

export class SetRemovableIngredientsDto {
  @ApiProperty({ type: [String], example: ["Cebola", "Tomate"] })
  @IsArray()
  @IsString({ each: true })
  names: string[];
}
