import { Injectable } from "@nestjs/common";
import { asc, eq } from "drizzle-orm";
import { DrizzleService } from "@shared/infra/database/drizzle.service";
import { Category } from "../../domain/models/category";
import { CategoryRepository } from "../../domain/repositories/category.repository";
import { categoriesSchema } from "../schemas/category.schema";

@Injectable()
export class DrizzleCategoryRepository implements CategoryRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async create(data: {
    name: string;
    iconKey?: string | null;
    displayOrder?: number;
  }): Promise<Category> {
    const [row] = await this.drizzle.db
      .insert(categoriesSchema)
      .values({
        name: data.name,
        iconKey: data.iconKey ?? null,
        displayOrder: data.displayOrder ?? 0,
      })
      .returning();
    return this.toModel(row);
  }

  async findAll(): Promise<Category[]> {
    const rows = await this.drizzle.db
      .select()
      .from(categoriesSchema)
      .orderBy(asc(categoriesSchema.displayOrder), asc(categoriesSchema.name));
    return rows.map((r) => this.toModel(r));
  }

  async findById(id: string): Promise<Category | null> {
    const rows = await this.drizzle.db
      .select()
      .from(categoriesSchema)
      .where(eq(categoriesSchema.id, id))
      .limit(1);
    return rows[0] ? this.toModel(rows[0]) : null;
  }

  async update(
    id: string,
    data: Partial<{ name: string; iconKey: string | null; displayOrder: number }>,
  ): Promise<Category> {
    const [row] = await this.drizzle.db
      .update(categoriesSchema)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(categoriesSchema.id, id))
      .returning();
    return this.toModel(row);
  }

  async delete(id: string): Promise<void> {
    await this.drizzle.db
      .delete(categoriesSchema)
      .where(eq(categoriesSchema.id, id));
  }

  async hasProducts(_id: string): Promise<boolean> {
    // Will be implemented when products module exists
    return false;
  }

  private toModel(row: typeof categoriesSchema.$inferSelect): Category {
    return Category.restore({
      id: row.id,
      name: row.name,
      iconKey: row.iconKey ?? null,
      displayOrder: row.displayOrder,
      createdAt: row.createdAt as unknown as Date,
      updatedAt: row.updatedAt as unknown as Date,
    })!;
  }
}
