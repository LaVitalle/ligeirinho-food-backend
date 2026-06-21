import { Injectable } from "@nestjs/common";
import { SQL, and, asc, eq, ilike } from "drizzle-orm";
import { DrizzleService } from "@shared/infra/database/drizzle.service";
import { categoriesSchema } from "../../../categories/infra/schemas/category.schema";
import { Icon } from "../../domain/models/icon";
import { IconRepository } from "../../domain/repositories/icon.repository";
import { iconsSchema } from "../schemas/icon.schema";

@Injectable()
export class DrizzleIconRepository implements IconRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async create(data: {
    key: string;
    name: string;
    url: string;
    tag?: string | null;
  }): Promise<Icon> {
    const [row] = await this.drizzle.db
      .insert(iconsSchema)
      .values({
        key: data.key,
        name: data.name,
        url: data.url,
        tag: data.tag ?? null,
      })
      .returning();
    return this.toModel(row);
  }

  async findAll(filters?: { tag?: string; search?: string }): Promise<Icon[]> {
    const conditions: SQL[] = [];
    if (filters?.tag) {
      conditions.push(eq(iconsSchema.tag, filters.tag));
    }
    if (filters?.search) {
      conditions.push(ilike(iconsSchema.name, `%${filters.search}%`));
    }

    const rows = await this.drizzle.db
      .select()
      .from(iconsSchema)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(iconsSchema.name));
    return rows.map((r) => this.toModel(r));
  }

  async findById(id: string): Promise<Icon | null> {
    const rows = await this.drizzle.db
      .select()
      .from(iconsSchema)
      .where(eq(iconsSchema.id, id))
      .limit(1);
    return rows[0] ? this.toModel(rows[0]) : null;
  }

  async findByKey(key: string): Promise<Icon | null> {
    const rows = await this.drizzle.db
      .select()
      .from(iconsSchema)
      .where(eq(iconsSchema.key, key))
      .limit(1);
    return rows[0] ? this.toModel(rows[0]) : null;
  }

  async update(
    id: string,
    data: Partial<{ name: string; url: string; tag: string | null }>,
  ): Promise<Icon> {
    const [row] = await this.drizzle.db
      .update(iconsSchema)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(iconsSchema.id, id))
      .returning();
    return this.toModel(row);
  }

  async delete(id: string): Promise<void> {
    await this.drizzle.db.delete(iconsSchema).where(eq(iconsSchema.id, id));
  }

  async isKeyInUse(key: string): Promise<boolean> {
    const rows = await this.drizzle.db
      .select({ id: categoriesSchema.id })
      .from(categoriesSchema)
      .where(eq(categoriesSchema.iconKey, key))
      .limit(1);
    return rows.length > 0;
  }

  private toModel(row: typeof iconsSchema.$inferSelect): Icon {
    return Icon.restore({
      id: row.id,
      key: row.key,
      name: row.name,
      url: row.url,
      tag: row.tag ?? null,
      createdAt: row.createdAt as unknown as Date,
      updatedAt: row.updatedAt as unknown as Date,
    })!;
  }
}
