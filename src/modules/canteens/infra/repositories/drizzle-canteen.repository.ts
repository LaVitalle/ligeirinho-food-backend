import { Injectable } from "@nestjs/common";
import { SQL, and, asc, count, eq, ilike, isNull } from "drizzle-orm";
import { PaginatedResult } from "@shared/application/dto/paginated-result";
import { DrizzleService } from "@shared/infra/database/drizzle.service";
import { Canteen } from "../../domain/models/canteen";
import { CanteenRepository } from "../../domain/repositories/canteen.repository";
import { canteensSchema } from "../schemas/canteen.schema";

@Injectable()
export class DrizzleCanteenRepository implements CanteenRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async create(data: {
    institutionId: string;
    name: string;
    cnpj?: string | null;
    block?: string | null;
    room?: string | null;
    logoUrl?: string | null;
  }): Promise<Canteen> {
    const [row] = await this.drizzle.db
      .insert(canteensSchema)
      .values({
        institutionId: data.institutionId,
        name: data.name,
        cnpj: data.cnpj ?? null,
        block: data.block ?? null,
        room: data.room ?? null,
        logoUrl: data.logoUrl ?? null,
      })
      .returning();

    return this.toModel(row);
  }

  async findById(id: string): Promise<Canteen | null> {
    const rows = await this.drizzle.db
      .select()
      .from(canteensSchema)
      .where(and(eq(canteensSchema.id, id), isNull(canteensSchema.deletedAt)))
      .limit(1);

    return rows[0] ? this.toModel(rows[0]) : null;
  }

  async findAll(
    page: number,
    perPage: number,
    filters?: { institutionId?: string; search?: string },
  ): Promise<PaginatedResult<Canteen>> {
    const offset = (page - 1) * perPage;
    const conditions: SQL[] = [isNull(canteensSchema.deletedAt)];

    if (filters?.institutionId) {
      conditions.push(eq(canteensSchema.institutionId, filters.institutionId));
    }
    if (filters?.search) {
      conditions.push(ilike(canteensSchema.name, `%${filters.search}%`));
    }

    const rows = await this.drizzle.db
      .select()
      .from(canteensSchema)
      .where(and(...conditions))
      .orderBy(asc(canteensSchema.name))
      .limit(perPage + 1)
      .offset(offset);

    return PaginatedResult.fromRows(rows.map((r) => this.toModel(r)), page, perPage);
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      cnpj: string | null;
      block: string | null;
      room: string | null;
      logoUrl: string | null;
      isOpen: boolean;
      deletedAt: Date | null;
    }>,
  ): Promise<Canteen> {
    const [row] = await this.drizzle.db
      .update(canteensSchema)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(canteensSchema.id, id))
      .returning();

    return this.toModel(row);
  }

  async delete(id: string): Promise<void> {
    await this.drizzle.db
      .update(canteensSchema)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(canteensSchema.id, id));
  }

  async count(institutionId?: string): Promise<number> {
    const conditions: SQL[] = [isNull(canteensSchema.deletedAt)];
    if (institutionId) {
      conditions.push(eq(canteensSchema.institutionId, institutionId));
    }
    const [row] = await this.drizzle.db
      .select({ total: count() })
      .from(canteensSchema)
      .where(and(...conditions));
    return row.total;
  }

  private toModel(row: typeof canteensSchema.$inferSelect): Canteen {
    return Canteen.restore({
      id: row.id,
      institutionId: row.institutionId,
      name: row.name,
      cnpj: row.cnpj ?? null,
      block: row.block ?? null,
      room: row.room ?? null,
      logoUrl: row.logoUrl ?? null,
      isOpen: row.isOpen,
      createdAt: row.createdAt as unknown as Date,
      updatedAt: row.updatedAt as unknown as Date,
      deletedAt: row.deletedAt as unknown as Date | null,
    })!;
  }
}
