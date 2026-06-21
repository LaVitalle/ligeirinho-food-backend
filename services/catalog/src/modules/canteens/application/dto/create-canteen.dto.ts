import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateCanteenDto {
  @ApiProperty({ example: "Cantina Central" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @ApiProperty({ example: "uuid-da-instituicao" })
  @IsUUID()
  institutionId: string;

  @ApiPropertyOptional({ example: "12.345.678/0001-99" })
  @IsOptional()
  @IsString()
  @MaxLength(18)
  cnpj?: string;

  @ApiPropertyOptional({ example: "Bloco A" })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  block?: string;

  @ApiPropertyOptional({ example: "Sala 101" })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  room?: string;

  @ApiProperty({ example: "João da Silva" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sellerName: string;

  @ApiProperty({ example: "seller@email.com" })
  @IsEmail()
  sellerEmail: string;

  @ApiProperty({ example: "senha123" })
  @IsString()
  @MinLength(6)
  sellerPassword: string;
}
