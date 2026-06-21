import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
  MinLength,
} from "class-validator";

export class RegisterDto {
  @ApiProperty({
    description: "Nome completo do usuário",
    example: "Maria da Silva",
    minLength: 3,
  })
  @IsString()
  @MinLength(3)
  fullName: string;

  @ApiProperty({
    description: "Endereço de e-mail do usuário. Usado para login e comunicações",
    example: "maria.silva@exemplo.com",
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: "Senha de acesso. Mínimo de 6 caracteres",
    example: "Senha@2025",
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    description: "Número de telefone celular com DDD e código do país",
    example: "+55 11 99999-9999",
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({
    description:
      "Código de acesso de 6 dígitos numéricos da instituição. Fornecido pelo administrador da instituição ao cliente",
    example: "482931",
    minLength: 6,
    maxLength: 6,
    pattern: "^\\d{6}$",
  })
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: "accessCode deve conter exatamente 6 dígitos" })
  accessCode: string;
}
