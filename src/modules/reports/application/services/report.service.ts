import { Injectable } from "@nestjs/common";
import { and, count, eq, gte, lte, sql, sum } from "drizzle-orm";
import { DrizzleService } from "@shared/infra/database/drizzle.service";
import { ordersSchema, orderItemsSchema } from "../../../orders/infra/schemas/order.schema";
import { institutionsSchema } from "../../../institutions/infra/schemas/institution.schema";
import { canteensSchema } from "../../../canteens/infra/schemas/canteen.schema";

@Injectable()
export class ReportService {
  constructor(private readonly drizzle: DrizzleService) {}

  async revenue(
    canteenId: string,
    from?: string,
    to?: string,
  ): Promise<{ current: number; previous: number; deltaPercent: number }> {
    const toDate = to ? new Date(to) : new Date();
    const fromDate = from
      ? new Date(from)
      : new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    const span = toDate.getTime() - fromDate.getTime();
    const prevFrom = new Date(fromDate.getTime() - span);
    const prevTo = new Date(fromDate.getTime());

    const current = await this.sumRevenue(canteenId, fromDate, toDate);
    const previous = await this.sumRevenue(canteenId, prevFrom, prevTo);
    const deltaPercent =
      previous === 0 ? (current > 0 ? 100 : 0) : ((current - previous) / previous) * 100;

    return {
      current: parseFloat(current.toFixed(2)),
      previous: parseFloat(previous.toFixed(2)),
      deltaPercent: parseFloat(deltaPercent.toFixed(2)),
    };
  }

  async ordersCount(
    canteenId: string,
    from?: string,
    to?: string,
  ): Promise<{ current: number; previous: number; deltaPercent: number }> {
    const toDate = to ? new Date(to) : new Date();
    const fromDate = from
      ? new Date(from)
      : new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    const span = toDate.getTime() - fromDate.getTime();
    const prevFrom = new Date(fromDate.getTime() - span);
    const prevTo = new Date(fromDate.getTime());

    const current = await this.countOrders(canteenId, fromDate, toDate);
    const previous = await this.countOrders(canteenId, prevFrom, prevTo);
    const deltaPercent =
      previous === 0 ? (current > 0 ? 100 : 0) : ((current - previous) / previous) * 100;

    return {
      current,
      previous,
      deltaPercent: parseFloat(deltaPercent.toFixed(2)),
    };
  }

  async revenueTrend(
    canteenId: string,
  ): Promise<{ date: string; total: number }[]> {
    const result: { date: string; total: number }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(day.getDate() - i);
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const total = await this.sumRevenue(canteenId, dayStart, dayEnd);
      result.push({
        date: dayStart.toISOString().slice(0, 10),
        total: parseFloat(total.toFixed(2)),
      });
    }

    return result;
  }

  async topProducts(
    canteenId: string,
    limit = 5,
    days = 30,
  ): Promise<{ productId: string; name: string; quantity: number; revenue: number }[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const rows = await this.drizzle.db
      .select({
        productId: orderItemsSchema.productId,
        name: orderItemsSchema.productNameSnapshot,
        quantity: sum(orderItemsSchema.quantity),
        revenue: sql<string>`SUM(${orderItemsSchema.unitPriceAtPurchase}::numeric * ${orderItemsSchema.quantity})`,
      })
      .from(orderItemsSchema)
      .innerJoin(ordersSchema, eq(orderItemsSchema.orderId, ordersSchema.id))
      .where(
        and(
          eq(ordersSchema.canteenId, canteenId),
          eq(ordersSchema.status, "RETIRADO"),
          gte(ordersSchema.createdAt, since),
        ),
      )
      .groupBy(orderItemsSchema.productId, orderItemsSchema.productNameSnapshot)
      .orderBy(sql`SUM(${orderItemsSchema.quantity}) DESC`)
      .limit(limit);

    return rows.map((r) => ({
      productId: r.productId,
      name: r.name,
      quantity: Number(r.quantity),
      revenue: parseFloat(r.revenue ?? "0"),
    }));
  }

  async adminCounts(): Promise<{ institutions: number; canteens: number }> {
    const [inst] = await this.drizzle.db
      .select({ total: count() })
      .from(institutionsSchema);
    const [cant] = await this.drizzle.db
      .select({ total: count() })
      .from(canteensSchema);
    return { institutions: inst.total, canteens: cant.total };
  }

  private async sumRevenue(
    canteenId: string,
    from: Date,
    to: Date,
  ): Promise<number> {
    const [row] = await this.drizzle.db
      .select({ total: sum(ordersSchema.total) })
      .from(ordersSchema)
      .where(
        and(
          eq(ordersSchema.canteenId, canteenId),
          eq(ordersSchema.status, "RETIRADO"),
          gte(ordersSchema.createdAt, from),
          lte(ordersSchema.createdAt, to),
        ),
      );
    return parseFloat(row.total ?? "0");
  }

  private async countOrders(
    canteenId: string,
    from: Date,
    to: Date,
  ): Promise<number> {
    const [row] = await this.drizzle.db
      .select({ total: count() })
      .from(ordersSchema)
      .where(
        and(
          eq(ordersSchema.canteenId, canteenId),
          eq(ordersSchema.status, "RETIRADO"),
          gte(ordersSchema.createdAt, from),
          lte(ordersSchema.createdAt, to),
        ),
      );
    return row.total;
  }
}
