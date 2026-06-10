import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DrizzleService } from "@shared/infra/database/drizzle.service";
import { CartItem, CartRepository } from "../../domain/repositories/cart.repository";
import { cartItemExtrasSchema, cartItemsSchema } from "../schemas/cart.schema";
import { productsViewSchema } from "../../../projections/infra/schemas/product-view.schema";

@Injectable()
export class DrizzleCartRepository implements CartRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async addItem(data: {
    userId: string;
    productId: string;
    quantity: number;
    note?: string | null;
    extras?: { extraId: string; name: string; price: string }[];
  }): Promise<void> {
    const [item] = await this.drizzle.db
      .insert(cartItemsSchema)
      .values({
        userId: data.userId,
        productId: data.productId,
        quantity: data.quantity,
        note: data.note ?? null,
      })
      .returning();

    if (data.extras?.length) {
      await this.drizzle.db.insert(cartItemExtrasSchema).values(
        data.extras.map((extra) => ({
          cartItemId: item.id,
          extraId: extra.extraId,
          extraNameSnapshot: extra.name,
          extraPriceSnapshot: extra.price,
        })),
      );
    }
  }

  async getItems(userId: string): Promise<CartItem[]> {
    const rows = await this.drizzle.db
      .select({
        id: cartItemsSchema.id,
        productId: cartItemsSchema.productId,
        productName: productsViewSchema.name,
        productPrice: productsViewSchema.price,
        canteenId: productsViewSchema.canteenId,
        quantity: cartItemsSchema.quantity,
        note: cartItemsSchema.note,
      })
      .from(cartItemsSchema)
      .innerJoin(
        productsViewSchema,
        eq(cartItemsSchema.productId, productsViewSchema.id),
      )
      .where(eq(cartItemsSchema.userId, userId));

    const items: CartItem[] = [];
    for (const row of rows) {
      const extraRows = await this.drizzle.db
        .select({
          id: cartItemExtrasSchema.extraId,
          name: cartItemExtrasSchema.extraNameSnapshot,
          price: cartItemExtrasSchema.extraPriceSnapshot,
        })
        .from(cartItemExtrasSchema)
        .where(eq(cartItemExtrasSchema.cartItemId, row.id));

      items.push({
        id: row.id,
        productId: row.productId,
        productName: row.productName,
        productPrice: row.productPrice,
        canteenId: row.canteenId,
        quantity: row.quantity,
        note: row.note,
        extras: extraRows,
      });
    }

    return items;
  }

  async updateItemQuantity(itemId: string, quantity: number): Promise<void> {
    await this.drizzle.db
      .update(cartItemsSchema)
      .set({ quantity })
      .where(eq(cartItemsSchema.id, itemId));
  }

  async removeItem(itemId: string): Promise<void> {
    await this.drizzle.db
      .delete(cartItemExtrasSchema)
      .where(eq(cartItemExtrasSchema.cartItemId, itemId));
    await this.drizzle.db
      .delete(cartItemsSchema)
      .where(eq(cartItemsSchema.id, itemId));
  }

  async clear(userId: string): Promise<void> {
    const items = await this.drizzle.db
      .select({ id: cartItemsSchema.id })
      .from(cartItemsSchema)
      .where(eq(cartItemsSchema.userId, userId));

    for (const item of items) {
      await this.drizzle.db
        .delete(cartItemExtrasSchema)
        .where(eq(cartItemExtrasSchema.cartItemId, item.id));
    }

    await this.drizzle.db
      .delete(cartItemsSchema)
      .where(eq(cartItemsSchema.userId, userId));
  }

  async getCanteenId(userId: string): Promise<string | null> {
    const rows = await this.drizzle.db
      .select({ canteenId: productsViewSchema.canteenId })
      .from(cartItemsSchema)
      .innerJoin(
        productsViewSchema,
        eq(cartItemsSchema.productId, productsViewSchema.id),
      )
      .where(eq(cartItemsSchema.userId, userId))
      .limit(1);

    return rows[0]?.canteenId ?? null;
  }
}
