import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";
import { Category } from "../../domain/models/category";

export class CreateCategoryDto {
  @ApiProperty({ description: "Nome da categoria de produtos", example: "Salgados", maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: "Key do ícone a associar (deve existir no catálogo de ícones)", example: "snack", maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  iconKey?: string;

  @ApiPropertyOptional({ description: "Posição de exibição na listagem (menor = primeiro). Default: 0", example: 1, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional({ description: "Novo nome da categoria", example: "Bebidas", maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: "Nova key do ícone a associar (null para remover ícone)", example: "drink", maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  iconKey?: string;

  @ApiPropertyOptional({ description: "Nova posição de exibição", example: 2, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}

export class CategoryResponseDto {
  @ApiProperty({ description: "UUID da categoria", example: "33445566-7788-99aa-bbcc-ddeeff001122" }) id: string;
  @ApiProperty({ description: "Nome da categoria", example: "Salgados" }) name: string;
  @ApiPropertyOptional({ description: "Key do ícone associado (referência ao catálogo de ícones)", example: "snack", nullable: true }) iconKey: string | null;
  @ApiPropertyOptional({ description: "URL pública da imagem do ícone (resolvida pelo serviço de ícones). Null se não houver ícone vinculado.", example: "https://cdn.example.com/icons/snack.svg", nullable: true }) iconUrl: string | null;
  @ApiProperty({ description: "Posição de exibição na listagem (menor = primeiro)", example: 1 }) displayOrder: number;

  static from(
    category: Category,
    iconUrl?: string | null,
  ): CategoryResponseDto {
    const dto = new CategoryResponseDto();
    dto.id = category.id;
    dto.name = category.name;
    dto.iconKey = category.iconKey;
    dto.iconUrl = iconUrl ?? null;
    dto.displayOrder = category.displayOrder;
    return dto;
  }
}
