import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";
import { PaymentMethod } from "../../domain/models/payment-method";
import { PaymentMethodType } from "../../domain/models/payment-method-type";

export class CreatePaymentMethodDto {
  @ApiProperty({
    description: "Nome exibido ao cliente no checkout",
    example: "Pix",
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: "Descrição opcional com detalhes do método",
    example: "Pagamento instantâneo via Pix",
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiProperty({
    description: "Categoria do método de pagamento",
    enum: PaymentMethodType,
    enumName: "PaymentMethodType",
    example: PaymentMethodType.PIX,
  })
  @IsEnum(PaymentMethodType)
  type: PaymentMethodType;

  @ApiPropertyOptional({
    description: "Key do ícone associado (deve existir no serviço de ícones do catalog)",
    example: "pix",
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  iconKey?: string;

  @ApiPropertyOptional({
    description: "Posição de exibição na listagem (menor = primeiro). Default: 0",
    example: 1,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional({
    description: "Se o método está disponível para uso imediato. Default: true",
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePaymentMethodDto {
  @ApiPropertyOptional({
    description: "Novo nome exibido ao cliente no checkout",
    example: "Cartão de crédito",
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: "Nova descrição do método",
    example: "Visa, Mastercard, Elo",
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({
    description: "Nova categoria do método de pagamento",
    enum: PaymentMethodType,
    enumName: "PaymentMethodType",
  })
  @IsOptional()
  @IsEnum(PaymentMethodType)
  type?: PaymentMethodType;

  @ApiPropertyOptional({
    description: "Nova key do ícone associado",
    example: "credit-card",
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  iconKey?: string;

  @ApiPropertyOptional({
    description: "Nova posição de exibição",
    example: 2,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional({
    description: "Novo status de disponibilidade",
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class PaymentMethodResponseDto {
  @ApiProperty({ description: "UUID do método de pagamento", example: "c4e5f6a7-8b9c-0d1e-2f3a-4b5c6d7e8f9a" }) id: string;
  @ApiProperty({ description: "Nome exibido ao cliente", example: "Pix" }) name: string;
  @ApiPropertyOptional({ description: "Descrição opcional do método", example: "Pagamento instantâneo via Pix", nullable: true }) description: string | null;
  @ApiProperty({
    description: "Categoria do método de pagamento",
    enum: PaymentMethodType,
    enumName: "PaymentMethodType",
    example: PaymentMethodType.PIX,
  }) type: PaymentMethodType;
  @ApiPropertyOptional({ description: "Key do ícone associado (referência ao serviço de ícones)", example: "pix", nullable: true }) iconKey: string | null;
  @ApiProperty({ description: "Indica se o método está disponível para seleção pelos clientes", example: true }) isActive: boolean;
  @ApiProperty({ description: "Posição de exibição na listagem (menor = primeiro)", example: 1 }) displayOrder: number;
  @ApiProperty({ description: "Data de criação do método", example: "2024-01-15T10:30:00.000Z" }) createdAt: Date;

  static from(paymentMethod: PaymentMethod): PaymentMethodResponseDto {
    const dto = new PaymentMethodResponseDto();
    dto.id = paymentMethod.id;
    dto.name = paymentMethod.name;
    dto.description = paymentMethod.description;
    dto.type = paymentMethod.type;
    dto.iconKey = paymentMethod.iconKey;
    dto.isActive = paymentMethod.isActive;
    dto.displayOrder = paymentMethod.displayOrder;
    dto.createdAt = paymentMethod.createdAt;
    return dto;
  }
}
