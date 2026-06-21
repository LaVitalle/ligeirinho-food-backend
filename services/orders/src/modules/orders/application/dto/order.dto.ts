import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";
import { OrderRow } from "../../domain/repositories/order.repository";

export class CreateOrderDto {
  @ApiProperty({
    description: "UUID do método de pagamento selecionado pelo cliente. Deve estar ativo (isActive = true).",
    example: "b3f1c2d4-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
  })
  @IsUUID()
  paymentMethodId: string;
}

export class OrderResponseDto {
  @ApiProperty({ description: "UUID do pedido", example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" }) id: string;
  @ApiProperty({ description: "UUID do cliente que realizou o pedido", example: "f9e8d7c6-b5a4-3210-fedc-ba9876543210" }) userId: string;
  @ApiProperty({ description: "UUID da cantina que receberá o pedido", example: "11223344-5566-7788-9900-aabbccddeeff" }) canteenId: string;
  @ApiProperty({ description: "Status atual do pedido (máquina de estados)", example: "AGUARDANDO_CONFIRMACAO" }) status: string;
  @ApiProperty({ description: "Valor total do pedido em reais (decimal como string para evitar perda de precisão)", example: "35.90" }) total: string;
  @ApiProperty({ description: "UUID do método de pagamento escolhido no momento do pedido", example: "b3f1c2d4-5e6f-7a8b-9c0d-1e2f3a4b5c6d" }) paymentMethodId: string;
  @ApiProperty({ description: "Nome do método de pagamento capturado no momento do pedido (snapshot imutável)", example: "Pix" }) paymentMethodNameSnapshot: string;
  @ApiProperty({ description: "Tipo do método de pagamento capturado no momento do pedido (snapshot imutável)", example: "PIX" }) paymentMethodType: string;
  @ApiPropertyOptional({ description: "Nota de avaliação dada pelo cliente após a retirada (1 a 5)", example: 5, nullable: true }) rating: number | null;
  @ApiPropertyOptional({ description: "Comentário da avaliação", example: "Muito rápido e saboroso!", nullable: true }) ratingComment: string | null;
  @ApiPropertyOptional({ description: "Motivo do cancelamento quando aplicável", example: "Não conseguirei retirar hoje", nullable: true }) cancelReason: string | null;
  @ApiProperty({ description: "Data de criação do pedido", example: "2024-01-15T12:00:00.000Z" }) createdAt: Date;
  @ApiProperty({ description: "Data da última atualização do pedido", example: "2024-01-15T12:05:00.000Z" }) updatedAt: Date;
  @ApiProperty({ description: "Itens do pedido", type: () => [OrderItemDto] }) items: OrderItemDto[];

  static from(row: OrderRow): OrderResponseDto {
    const dto = new OrderResponseDto();
    dto.id = row.id;
    dto.userId = row.userId;
    dto.canteenId = row.canteenId;
    dto.status = row.status;
    dto.total = row.total;
    dto.paymentMethodId = row.paymentMethodId;
    dto.paymentMethodNameSnapshot = row.paymentMethodNameSnapshot;
    dto.paymentMethodType = row.paymentMethodType;
    dto.rating = row.rating;
    dto.ratingComment = row.ratingComment;
    dto.cancelReason = row.cancelReason;
    dto.createdAt = row.createdAt;
    dto.updatedAt = row.updatedAt;
    dto.items = row.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      productNameSnapshot: i.productNameSnapshot,
      unitPriceAtPurchase: i.unitPriceAtPurchase,
      quantity: i.quantity,
      note: i.note,
      extras: i.extras,
    }));
    return dto;
  }
}

export class OrderItemExtraDto {
  @ApiProperty({ description: "UUID do adicional", example: "aa11bb22-cc33-dd44-ee55-ff6677889900" }) extraId: string;
  @ApiProperty({ description: "Nome do adicional capturado no momento do pedido (snapshot imutável)", example: "Queijo extra" }) extraNameSnapshot: string;
  @ApiProperty({ description: "Preço unitário do adicional no momento do pedido (decimal como string)", example: "2.00" }) unitPriceAtPurchase: string;
}

export class OrderItemDto {
  @ApiProperty({ description: "UUID do item do pedido", example: "d4e5f6a7-b8c9-0123-4567-890abcdef123" }) id: string;
  @ApiProperty({ description: "UUID do produto", example: "12345678-9abc-def0-1234-567890abcdef" }) productId: string;
  @ApiProperty({ description: "Nome do produto capturado no momento do pedido (snapshot imutável)", example: "Coxinha de frango" }) productNameSnapshot: string;
  @ApiProperty({ description: "Preço unitário do produto no momento do pedido (decimal como string)", example: "8.50" }) unitPriceAtPurchase: string;
  @ApiProperty({ description: "Quantidade de unidades do item", example: 2 }) quantity: number;
  @ApiPropertyOptional({ description: "Observação do cliente para este item (ex: sem pimenta)", example: "Sem pimenta", nullable: true }) note: string | null;
  @ApiProperty({ description: "Adicionais selecionados para este item", type: () => [OrderItemExtraDto] }) extras: OrderItemExtraDto[];
}

export class CancelOrderDto {
  @ApiPropertyOptional({
    description: "Motivo do cancelamento (opcional, mas recomendado para análise de qualidade)",
    example: "Não conseguirei retirar hoje",
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class RateOrderDto {
  @ApiProperty({
    description: "Nota de avaliação do pedido de 1 (péssimo) a 5 (excelente)",
    minimum: 1,
    maximum: 5,
    example: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({
    description: "Comentário livre sobre a experiência com o pedido",
    example: "Muito rápido e saboroso!",
  })
  @IsOptional()
  @IsString()
  comment?: string;
}
