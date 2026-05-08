import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from "class-validator";

export class AddCartItemDto {
  @ApiProperty() @IsUUID() productId: string;
  @ApiProperty({ example: 1 }) @IsInt() @Min(1) quantity: number;
  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  extraIds?: string[];
}

export class UpdateCartItemDto {
  @ApiProperty({ example: 2 }) @IsInt() @Min(1) quantity: number;
}
