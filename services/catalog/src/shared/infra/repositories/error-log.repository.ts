import { Injectable } from "@nestjs/common";
import { DrizzleService } from "../database/drizzle.service";
import { errorLogsSchema } from "../schemas/error-log.schema";

@Injectable()
export class ErrorLogRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async create(data: {
    status: number;
    message: string;
    stack?: string;
    path: string;
    method: string;
  }): Promise<void> {
    await this.drizzle.db.insert(errorLogsSchema).values(data);
  }
}
