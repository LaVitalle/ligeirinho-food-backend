import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";
import { Product } from "../../domain/models/product";

export class CreateProductDto {
  @ApiProperty() @IsUUID() canteenId: string;
  @ApiProperty() @IsUUID() categoryId: string;
  @ApiProperty({ example: "X-Burger" }) @IsString() @IsNotEmpty() @MaxLength(200) name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiProperty({ example: "15.90" }) @IsNumberString() price: string;
}

export class UpdateProductDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() categoryId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumberString() price?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}

export class ProductResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() canteenId: string;
  @ApiProperty() categoryId: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional() description: string | null;
  @ApiProperty() price: string;
  @ApiPropertyOptional() photoUrl: string | null;
  @ApiProperty() isActive: boolean;
  @ApiProperty() isFeatured: boolean;
  @ApiProperty() createdAt: Date;

  static from(product: Product): ProductResponseDto {
    const dto = new ProductResponseDto();
    dto.id = product.id;
    dto.canteenId = product.canteenId;
    dto.categoryId = product.categoryId;
    dto.name = product.name;
    dto.description = product.description;
    dto.price = product.price;
    dto.photoUrl = product.photoUrl;
    dto.isActive = product.isActive;
    dto.isFeatured = product.isFeatured;
    dto.createdAt = product.createdAt;
    return dto;
  }
}
