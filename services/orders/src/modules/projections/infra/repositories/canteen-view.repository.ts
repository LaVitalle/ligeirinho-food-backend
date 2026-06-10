import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DrizzleService } from "@shared/infra/database/drizzle.service";
import type { CanteenProjectionPayload } from "@shared/contracts/events/catalog-events.enum";
import { canteensViewSchema } from "../schemas/canteen-view.schema";

export interface CanteenView {
  id: string;
  institutionId: string;
  name: string;
  isOpen: boolean;
}

/**
 * Mantém a projeção local de cantinas (canteens_view) sincronizada com o
 * catalog-service via consumo de eventos.
 */
@Injectable()
export class CanteenViewRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async upsert(payload: CanteenProjectionPayload): Promise<void> {
    await this.drizzle.db
      .insert(canteensViewSchema)
      .values({
        id: payload.canteenId,
        institutionId: payload.institutionId,
        name: payload.name,
        isOpen: payload.isOpen,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: canteensViewSchema.id,
        set: {
          institutionId: payload.institutionId,
          name: payload.name,
          isOpen: payload.isOpen,
          updatedAt: new Date(),
        },
      });
  }

  async delete(id: string): Promise<void> {
    await this.drizzle.db
      .delete(canteensViewSchema)
      .where(eq(canteensViewSchema.id, id));
  }

  async findById(id: string): Promise<CanteenView | null> {
    const rows = await this.drizzle.db
      .select()
      .from(canteensViewSchema)
      .where(eq(canteensViewSchema.id, id))
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    return {
      id: row.id,
      institutionId: row.institutionId,
      name: row.name,
      isOpen: row.isOpen,
    };
  }
}
