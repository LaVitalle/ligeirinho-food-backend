import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DrizzleService } from "@shared/infra/database/drizzle.service";
import type { ProductProjectionPayload } from "@shared/contracts/events/catalog-events.enum";
import { productsViewSchema } from "../schemas/product-view.schema";

export interface ProductView {
  id: string;
  canteenId: string;
  name: string;
  price: string;
  isAvailable: boolean;
}

/**
 * Mantém a projeção local de produtos (products_view) sincronizada com o
 * catalog-service via consumo de eventos.
 */
@Injectable()
export class ProductViewRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async upsert(payload: ProductProjectionPayload): Promise<void> {
    await this.drizzle.db
      .insert(productsViewSchema)
      .values({
        id: payload.productId,
        canteenId: payload.canteenId,
        name: payload.name,
        price: payload.price,
        isAvailable: payload.isAvailable,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: productsViewSchema.id,
        set: {
          canteenId: payload.canteenId,
          name: payload.name,
          price: payload.price,
          isAvailable: payload.isAvailable,
          updatedAt: new Date(),
        },
      });
  }

  async delete(id: string): Promise<void> {
    await this.drizzle.db
      .delete(productsViewSchema)
      .where(eq(productsViewSchema.id, id));
  }

  async findById(id: string): Promise<ProductView | null> {
    const rows = await this.drizzle.db
      .select()
      .from(productsViewSchema)
      .where(eq(productsViewSchema.id, id))
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    return {
      id: row.id,
      canteenId: row.canteenId,
      name: row.name,
      price: row.price,
      isAvailable: row.isAvailable,
    };
  }
}
