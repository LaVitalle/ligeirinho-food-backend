import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from "class-validator";
import { Icon } from "../../domain/models/icon";

export class CreateIconDto {
  @ApiProperty({
    description: "Identificador único do ícone (slug imutável). Apenas letras minúsculas, dígitos e hífens.",
    example: "snack",
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Matches(/^[a-z0-9-]+$/)
  key: string;

  @ApiProperty({
    description: "Nome exibido do ícone",
    example: "Salgados",
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: "Tag de agrupamento para filtro na listagem",
    example: "food",
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  tag?: string;
}

export class UpdateIconDto {
  @ApiPropertyOptional({
    description: "Novo nome exibido do ícone",
    example: "Bebidas",
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: "Nova tag de agrupamento",
    example: "drink",
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  tag?: string;
}

export class IconResponseDto {
  @ApiProperty({ description: "UUID do ícone", example: "b3f1c2d4-5e6f-7a8b-9c0d-1e2f3a4b5c6d" }) id: string;
  @ApiProperty({ description: "Slug imutável do ícone", example: "snack" }) key: string;
  @ApiProperty({ description: "Nome exibido do ícone", example: "Salgados" }) name: string;
  @ApiProperty({ description: "URL pública da imagem do ícone no MinIO", example: "https://cdn.example.com/icons/snack.svg" }) url: string;
  @ApiPropertyOptional({ description: "Tag de agrupamento para filtro", example: "food", nullable: true }) tag: string | null;
  @ApiProperty({ description: "Data de criação do ícone", example: "2024-01-15T10:30:00.000Z" }) createdAt: Date;

  static from(icon: Icon): IconResponseDto {
    const dto = new IconResponseDto();
    dto.id = icon.id;
    dto.key = icon.key;
    dto.name = icon.name;
    dto.url = icon.url;
    dto.tag = icon.tag;
    dto.createdAt = icon.createdAt;
    return dto;
  }
}
