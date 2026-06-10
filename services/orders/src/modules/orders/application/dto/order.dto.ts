import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { OrderRow } from "../../domain/repositories/order.repository";

export class OrderResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() userId: string;
  @ApiProperty() canteenId: string;
  @ApiProperty() status: string;
  @ApiProperty() total: string;
  @ApiPropertyOptional() rating: number | null;
  @ApiPropertyOptional() ratingComment: string | null;
  @ApiPropertyOptional() cancelReason: string | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
  @ApiProperty() items: OrderItemDto[];

  static from(row: OrderRow): OrderResponseDto {
    const dto = new OrderResponseDto();
    dto.id = row.id;
    dto.userId = row.userId;
    dto.canteenId = row.canteenId;
    dto.status = row.status;
    dto.total = row.total;
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

export class OrderItemDto {
  @ApiProperty() id: string;
  @ApiProperty() productId: string;
  @ApiProperty() productNameSnapshot: string;
  @ApiProperty() unitPriceAtPurchase: string;
  @ApiProperty() quantity: number;
  @ApiPropertyOptional() note: string | null;
  @ApiProperty() extras: {
    extraId: string;
    extraNameSnapshot: string;
    unitPriceAtPurchase: string;
  }[];
}

export class CancelOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class RateOrderDto {
  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;
}
