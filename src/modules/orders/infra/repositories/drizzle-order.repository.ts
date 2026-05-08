import { Injectable } from "@nestjs/common";
import { SQL, and, asc, eq, inArray, not } from "drizzle-orm";
import { PaginatedResult } from "@shared/application/dto/paginated-result";
import { DrizzleService } from "@shared/infra/database/drizzle.service";
import { OrderStatus } from "../../domain/models/order-status";
import {
  OrderItemRow,
  OrderRepository,
  OrderRow,
} from "../../domain/repositories/order.repository";
import {
  orderItemExtrasSchema,
  orderItemsSchema,
  ordersSchema,
} from "../schemas/order.schema";

@Injectable()
export class DrizzleOrderRepository implements OrderRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async create(data: {
    userId: string;
    canteenId: string;
    total: string;
    items: {
      productId: string;
      productNameSnapshot: string;
      unitPriceAtPurchase: string;
      quantity: number;
      note: string | null;
      extras: {
        extraId: string;
        extraNameSnapshot: string;
        unitPriceAtPurchase: string;
      }[];
    }[];
  }): Promise<OrderRow> {
    const [order] = await this.drizzle.db
      .insert(ordersSchema)
      .values({
        userId: data.userId,
        canteenId: data.canteenId,
        total: data.total,
      })
      .returning();

    const items: OrderItemRow[] = [];

    for (const itemData of data.items) {
      const [item] = await this.drizzle.db
        .insert(orderItemsSchema)
        .values({
          orderId: order.id,
          productId: itemData.productId,
          productNameSnapshot: itemData.productNameSnapshot,
          unitPriceAtPurchase: itemData.unitPriceAtPurchase,
          quantity: itemData.quantity,
          note: itemData.note,
        })
        .returning();

      const extras: OrderItemRow["extras"] = [];
      for (const extraData of itemData.extras) {
        await this.drizzle.db.insert(orderItemExtrasSchema).values({
          orderItemId: item.id,
          extraId: extraData.extraId,
          extraNameSnapshot: extraData.extraNameSnapshot,
          unitPriceAtPurchase: extraData.unitPriceAtPurchase,
        });
        extras.push(extraData);
      }

      items.push({
        id: item.id,
        productId: item.productId,
        productNameSnapshot: item.productNameSnapshot,
        unitPriceAtPurchase: item.unitPriceAtPurchase,
        quantity: item.quantity,
        note: item.note,
        extras,
      });
    }

    return {
      id: order.id,
      userId: order.userId,
      canteenId: order.canteenId,
      status: order.status as OrderStatus,
      total: order.total,
      rating: order.rating,
      ratingComment: order.ratingComment,
      cancelReason: order.cancelReason,
      createdAt: order.createdAt as unknown as Date,
      updatedAt: order.updatedAt as unknown as Date,
      items,
    };
  }

  async findById(id: string): Promise<OrderRow | null> {
    const rows = await this.drizzle.db
      .select()
      .from(ordersSchema)
      .where(eq(ordersSchema.id, id))
      .limit(1);

    if (!rows[0]) return null;
    return this.hydrate(rows[0]);
  }

  async updateStatus(
    id: string,
    status: OrderStatus,
    cancelReason?: string,
  ): Promise<void> {
    const data: Record<string, unknown> = {
      status,
      updatedAt: new Date(),
    };
    if (cancelReason !== undefined) data.cancelReason = cancelReason;

    await this.drizzle.db
      .update(ordersSchema)
      .set(data)
      .where(eq(ordersSchema.id, id));
  }

  async setRating(
    id: string,
    rating: number,
    comment?: string | null,
  ): Promise<void> {
    await this.drizzle.db
      .update(ordersSchema)
      .set({ rating, ratingComment: comment ?? null, updatedAt: new Date() })
      .where(eq(ordersSchema.id, id));
  }

  async findByUser(
    userId: string,
    terminal: boolean,
    page: number,
    perPage: number,
  ): Promise<PaginatedResult<OrderRow>> {
    const offset = (page - 1) * perPage;
    const terminalStatuses = [OrderStatus.RETIRADO, OrderStatus.CANCELADO];

    const condition = terminal
      ? and(eq(ordersSchema.userId, userId), inArray(ordersSchema.status, terminalStatuses))
      : and(eq(ordersSchema.userId, userId), not(inArray(ordersSchema.status, terminalStatuses)));

    const rows = await this.drizzle.db
      .select()
      .from(ordersSchema)
      .where(condition)
      .orderBy(asc(ordersSchema.createdAt))
      .limit(perPage + 1)
      .offset(offset);

    const hydrated = await Promise.all(rows.map((r) => this.hydrate(r)));
    return PaginatedResult.fromRows(hydrated, page, perPage);
  }

  async findByCanteen(
    canteenId: string,
    statuses: OrderStatus[],
    page: number,
    perPage: number,
  ): Promise<PaginatedResult<OrderRow>> {
    const offset = (page - 1) * perPage;
    const conditions: SQL[] = [eq(ordersSchema.canteenId, canteenId)];
    if (statuses.length > 0) {
      conditions.push(inArray(ordersSchema.status, statuses));
    }

    const rows = await this.drizzle.db
      .select()
      .from(ordersSchema)
      .where(and(...conditions))
      .orderBy(asc(ordersSchema.createdAt))
      .limit(perPage + 1)
      .offset(offset);

    const hydrated = await Promise.all(rows.map((r) => this.hydrate(r)));
    return PaginatedResult.fromRows(hydrated, page, perPage);
  }

  private async hydrate(
    row: typeof ordersSchema.$inferSelect,
  ): Promise<OrderRow> {
    const itemRows = await this.drizzle.db
      .select()
      .from(orderItemsSchema)
      .where(eq(orderItemsSchema.orderId, row.id));

    const items: OrderItemRow[] = [];
    for (const item of itemRows) {
      const extraRows = await this.drizzle.db
        .select()
        .from(orderItemExtrasSchema)
        .where(eq(orderItemExtrasSchema.orderItemId, item.id));

      items.push({
        id: item.id,
        productId: item.productId,
        productNameSnapshot: item.productNameSnapshot,
        unitPriceAtPurchase: item.unitPriceAtPurchase,
        quantity: item.quantity,
        note: item.note,
        extras: extraRows.map((e) => ({
          extraId: e.extraId,
          extraNameSnapshot: e.extraNameSnapshot,
          unitPriceAtPurchase: e.unitPriceAtPurchase,
        })),
      });
    }

    return {
      id: row.id,
      userId: row.userId,
      canteenId: row.canteenId,
      status: row.status as OrderStatus,
      total: row.total,
      rating: row.rating,
      ratingComment: row.ratingComment,
      cancelReason: row.cancelReason,
      createdAt: row.createdAt as unknown as Date,
      updatedAt: row.updatedAt as unknown as Date,
      items,
    };
  }
}
