import { Injectable } from "@nestjs/common";
import { SQL, and, asc, eq, isNull } from "drizzle-orm";
import { PaginatedResult } from "@shared/application/dto/paginated-result";
import { DrizzleService } from "@shared/infra/database/drizzle.service";
import { Extra } from "../../domain/models/extra";
import { ExtraRepository } from "../../domain/repositories/extra.repository";
import {
  extrasSchema,
  productExtrasSchema,
  productRemovableIngredientsSchema,
} from "../schemas/extra.schema";

@Injectable()
export class DrizzleExtraRepository implements ExtraRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async create(data: {
    canteenId: string;
    name: string;
    price: string;
  }): Promise<Extra> {
    const [row] = await this.drizzle.db
      .insert(extrasSchema)
      .values(data)
      .returning();
    return this.toModel(row);
  }

  async findById(id: string): Promise<Extra | null> {
    const rows = await this.drizzle.db
      .select()
      .from(extrasSchema)
      .where(and(eq(extrasSchema.id, id), isNull(extrasSchema.deletedAt)))
      .limit(1);
    return rows[0] ? this.toModel(rows[0]) : null;
  }

  async findAll(
    page: number,
    perPage: number,
    canteenId: string,
  ): Promise<PaginatedResult<Extra>> {
    const offset = (page - 1) * perPage;
    const rows = await this.drizzle.db
      .select()
      .from(extrasSchema)
      .where(
        and(
          eq(extrasSchema.canteenId, canteenId),
          isNull(extrasSchema.deletedAt),
        ),
      )
      .orderBy(asc(extrasSchema.name))
      .limit(perPage + 1)
      .offset(offset);
    return PaginatedResult.fromRows(rows.map((r) => this.toModel(r)), page, perPage);
  }

  async update(
    id: string,
    data: Partial<{ name: string; price: string; isActive: boolean }>,
  ): Promise<Extra> {
    const [row] = await this.drizzle.db
      .update(extrasSchema)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(extrasSchema.id, id))
      .returning();
    return this.toModel(row);
  }

  async delete(id: string): Promise<void> {
    await this.drizzle.db
      .update(extrasSchema)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(extrasSchema.id, id));
  }

  async addToProduct(productId: string, extraId: string): Promise<void> {
    await this.drizzle.db
      .insert(productExtrasSchema)
      .values({ productId, extraId })
      .onConflictDoNothing();
  }

  async removeFromProduct(productId: string, extraId: string): Promise<void> {
    await this.drizzle.db
      .delete(productExtrasSchema)
      .where(
        and(
          eq(productExtrasSchema.productId, productId),
          eq(productExtrasSchema.extraId, extraId),
        ),
      );
  }

  async findByProduct(productId: string, onlyActive = false): Promise<Extra[]> {
    const conditions: SQL[] = [
      eq(productExtrasSchema.productId, productId),
      isNull(extrasSchema.deletedAt),
    ];
    if (onlyActive) {
      conditions.push(eq(extrasSchema.isActive, true));
    }

    const rows = await this.drizzle.db
      .select({ extra: extrasSchema })
      .from(productExtrasSchema)
      .innerJoin(extrasSchema, eq(productExtrasSchema.extraId, extrasSchema.id))
      .where(and(...conditions))
      .orderBy(asc(extrasSchema.name));

    return rows.map((r) => this.toModel(r.extra));
  }

  async setRemovableIngredients(
    productId: string,
    names: string[],
  ): Promise<{ id: string; name: string }[]> {
    await this.drizzle.db
      .delete(productRemovableIngredientsSchema)
      .where(eq(productRemovableIngredientsSchema.productId, productId));

    if (names.length === 0) return [];

    const rows = await this.drizzle.db
      .insert(productRemovableIngredientsSchema)
      .values(names.map((name) => ({ productId, name })))
      .returning();

    return rows.map((r) => ({ id: r.id, name: r.name }));
  }

  async findRemovableIngredients(
    productId: string,
  ): Promise<{ id: string; name: string }[]> {
    const rows = await this.drizzle.db
      .select({ id: productRemovableIngredientsSchema.id, name: productRemovableIngredientsSchema.name })
      .from(productRemovableIngredientsSchema)
      .where(eq(productRemovableIngredientsSchema.productId, productId));
    return rows;
  }

  private toModel(row: typeof extrasSchema.$inferSelect): Extra {
    return Extra.restore({
      id: row.id,
      canteenId: row.canteenId,
      name: row.name,
      price: row.price,
      isActive: row.isActive,
      createdAt: row.createdAt as unknown as Date,
      updatedAt: row.updatedAt as unknown as Date,
      deletedAt: row.deletedAt as unknown as Date | null,
    })!;
  }
}
