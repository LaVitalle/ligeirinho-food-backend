import { Injectable } from "@nestjs/common";
import { SQL, asc, eq } from "drizzle-orm";
import { DrizzleService } from "@shared/infra/database/drizzle.service";
import { ordersSchema } from "../../../orders/infra/schemas/order.schema";
import { PaymentMethod } from "../../domain/models/payment-method";
import { PaymentMethodType } from "../../domain/models/payment-method-type";
import { PaymentMethodRepository } from "../../domain/repositories/payment-method.repository";
import { paymentMethodsSchema } from "../schemas/payment-method.schema";

@Injectable()
export class DrizzlePaymentMethodRepository
  implements PaymentMethodRepository
{
  constructor(private readonly drizzle: DrizzleService) {}

  async create(data: {
    name: string;
    description?: string | null;
    type: PaymentMethodType;
    iconKey?: string | null;
    displayOrder?: number;
    isActive?: boolean;
  }): Promise<PaymentMethod> {
    const [row] = await this.drizzle.db
      .insert(paymentMethodsSchema)
      .values({
        name: data.name,
        description: data.description ?? null,
        type: data.type,
        iconKey: data.iconKey ?? null,
        displayOrder: data.displayOrder ?? 0,
        isActive: data.isActive ?? true,
      })
      .returning();
    return this.toModel(row);
  }

  async findAll(filters?: { onlyActive?: boolean }): Promise<PaymentMethod[]> {
    const condition: SQL | undefined = filters?.onlyActive
      ? eq(paymentMethodsSchema.isActive, true)
      : undefined;

    const rows = await this.drizzle.db
      .select()
      .from(paymentMethodsSchema)
      .where(condition)
      .orderBy(
        asc(paymentMethodsSchema.displayOrder),
        asc(paymentMethodsSchema.name),
      );
    return rows.map((r) => this.toModel(r));
  }

  async findById(id: string): Promise<PaymentMethod | null> {
    const rows = await this.drizzle.db
      .select()
      .from(paymentMethodsSchema)
      .where(eq(paymentMethodsSchema.id, id))
      .limit(1);
    return rows[0] ? this.toModel(rows[0]) : null;
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      description: string | null;
      type: PaymentMethodType;
      iconKey: string | null;
      displayOrder: number;
      isActive: boolean;
    }>,
  ): Promise<PaymentMethod> {
    const [row] = await this.drizzle.db
      .update(paymentMethodsSchema)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(paymentMethodsSchema.id, id))
      .returning();
    return this.toModel(row);
  }

  async delete(id: string): Promise<void> {
    await this.drizzle.db
      .delete(paymentMethodsSchema)
      .where(eq(paymentMethodsSchema.id, id));
  }

  async isInUse(id: string): Promise<boolean> {
    const rows = await this.drizzle.db
      .select({ id: ordersSchema.id })
      .from(ordersSchema)
      .where(eq(ordersSchema.paymentMethodId, id))
      .limit(1);
    return rows.length > 0;
  }

  private toModel(
    row: typeof paymentMethodsSchema.$inferSelect,
  ): PaymentMethod {
    return PaymentMethod.restore({
      id: row.id,
      name: row.name,
      description: row.description ?? null,
      type: row.type as PaymentMethodType,
      iconKey: row.iconKey ?? null,
      displayOrder: row.displayOrder,
      isActive: row.isActive,
      createdAt: row.createdAt as unknown as Date,
      updatedAt: row.updatedAt as unknown as Date,
    })!;
  }
}
