import { Injectable } from "@nestjs/common";
import { SQL, and, asc, eq, ilike, isNull } from "drizzle-orm";
import { PaginatedResult } from "@shared/application/dto/paginated-result";
import { DrizzleService } from "@shared/infra/database/drizzle.service";
import { Product } from "../../domain/models/product";
import {
  ProductListFilters,
  ProductRepository,
} from "../../domain/repositories/product.repository";
import { productsSchema } from "../schemas/product.schema";
import { canteensSchema } from "../../../canteens/infra/schemas/canteen.schema";

@Injectable()
export class DrizzleProductRepository implements ProductRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async create(data: {
    canteenId: string;
    categoryId: string;
    name: string;
    description?: string | null;
    price: string;
    photoUrl?: string | null;
  }): Promise<Product> {
    const [row] = await this.drizzle.db
      .insert(productsSchema)
      .values({
        canteenId: data.canteenId,
        categoryId: data.categoryId,
        name: data.name,
        description: data.description ?? null,
        price: data.price,
        photoUrl: data.photoUrl ?? null,
      })
      .returning();
    return this.toModel(row);
  }

  async findById(id: string): Promise<Product | null> {
    const rows = await this.drizzle.db
      .select()
      .from(productsSchema)
      .where(and(eq(productsSchema.id, id), isNull(productsSchema.deletedAt)))
      .limit(1);
    return rows[0] ? this.toModel(rows[0]) : null;
  }

  async findAll(
    page: number,
    perPage: number,
    filters: ProductListFilters,
  ): Promise<PaginatedResult<Product>> {
    const offset = (page - 1) * perPage;
    const conditions: SQL[] = [
      isNull(productsSchema.deletedAt),
      eq(productsSchema.canteenId, filters.canteenId),
    ];

    if (filters.categoryId) {
      conditions.push(eq(productsSchema.categoryId, filters.categoryId));
    }
    if (filters.search) {
      conditions.push(ilike(productsSchema.name, `%${filters.search}%`));
    }
    if (filters.onlyActive) {
      conditions.push(eq(productsSchema.isActive, true));
    }

    const rows = await this.drizzle.db
      .select()
      .from(productsSchema)
      .where(and(...conditions))
      .orderBy(asc(productsSchema.name))
      .limit(perPage + 1)
      .offset(offset);

    return PaginatedResult.fromRows(
      rows.map((r) => this.toModel(r)),
      page,
      perPage,
    );
  }

  async update(
    id: string,
    data: Partial<{
      categoryId: string;
      name: string;
      description: string | null;
      price: string;
      photoUrl: string | null;
      isActive: boolean;
      isFeatured: boolean;
      deletedAt: Date | null;
    }>,
  ): Promise<Product> {
    const [row] = await this.drizzle.db
      .update(productsSchema)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(productsSchema.id, id))
      .returning();
    return this.toModel(row);
  }

  async delete(id: string): Promise<void> {
    await this.drizzle.db
      .update(productsSchema)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(productsSchema.id, id));
  }

  async findFeatured(institutionId?: string, limit = 10): Promise<Product[]> {
    const conditions: SQL[] = [
      isNull(productsSchema.deletedAt),
      eq(productsSchema.isActive, true),
      eq(productsSchema.isFeatured, true),
    ];

    if (institutionId) {
      conditions.push(eq(canteensSchema.institutionId, institutionId));

      const rows = await this.drizzle.db
        .select({ product: productsSchema })
        .from(productsSchema)
        .innerJoin(canteensSchema, eq(productsSchema.canteenId, canteensSchema.id))
        .where(and(...conditions))
        .limit(limit);

      return rows.map((r) => this.toModel(r.product));
    }

    const rows = await this.drizzle.db
      .select()
      .from(productsSchema)
      .where(and(...conditions))
      .limit(limit);

    return rows.map((r) => this.toModel(r));
  }

  private toModel(row: typeof productsSchema.$inferSelect): Product {
    return Product.restore({
      id: row.id,
      canteenId: row.canteenId,
      categoryId: row.categoryId,
      name: row.name,
      description: row.description ?? null,
      price: row.price,
      photoUrl: row.photoUrl ?? null,
      isActive: row.isActive,
      isFeatured: row.isFeatured,
      createdAt: row.createdAt as unknown as Date,
      updatedAt: row.updatedAt as unknown as Date,
      deletedAt: row.deletedAt as unknown as Date | null,
    })!;
  }
}
