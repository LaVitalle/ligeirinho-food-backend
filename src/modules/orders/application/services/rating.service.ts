import { Inject, Injectable } from "@nestjs/common";
import { SQL, and, avg, count, desc, eq, isNotNull } from "drizzle-orm";
import { DrizzleService } from "@shared/infra/database/drizzle.service";
import { PaginatedResult } from "@shared/application/dto/paginated-result";
import { ordersSchema } from "../../infra/schemas/order.schema";
import { usersSchema } from "../../../users/infra/schemas/user.schema";

@Injectable()
export class RatingService {
  constructor(private readonly drizzle: DrizzleService) {}

  async getCanteenRatings(
    canteenId: string,
    page: number,
    perPage: number,
  ): Promise<PaginatedResult<{
    rating: number;
    comment: string | null;
    customerName: string;
    createdAt: Date;
  }>> {
    const offset = (page - 1) * perPage;

    const rows = await this.drizzle.db
      .select({
        rating: ordersSchema.rating,
        comment: ordersSchema.ratingComment,
        customerName: usersSchema.fullName,
        createdAt: ordersSchema.updatedAt,
      })
      .from(ordersSchema)
      .innerJoin(usersSchema, eq(ordersSchema.userId, usersSchema.id))
      .where(
        and(
          eq(ordersSchema.canteenId, canteenId),
          isNotNull(ordersSchema.rating),
        ),
      )
      .orderBy(desc(ordersSchema.updatedAt))
      .limit(perPage + 1)
      .offset(offset);

    const items = rows.map((r) => ({
      rating: r.rating!,
      comment: r.comment,
      customerName: r.customerName,
      createdAt: r.createdAt as unknown as Date,
    }));

    return PaginatedResult.fromRows(items, page, perPage);
  }

  async getCanteenAverage(
    canteenId: string,
  ): Promise<{ average: number; count: number }> {
    const [row] = await this.drizzle.db
      .select({
        average: avg(ordersSchema.rating),
        count: count(ordersSchema.rating),
      })
      .from(ordersSchema)
      .where(
        and(
          eq(ordersSchema.canteenId, canteenId),
          isNotNull(ordersSchema.rating),
        ),
      );

    return {
      average: row.average ? parseFloat(row.average) : 0,
      count: row.count,
    };
  }
}
