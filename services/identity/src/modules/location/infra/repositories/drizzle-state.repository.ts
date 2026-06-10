import { Injectable } from "@nestjs/common";
import { DrizzleService } from "@shared/infra/database/drizzle.service";
import { State } from "../../domain/models/state";
import { StateRepository } from "../../domain/repositories/state.repository";
import { statesSchema } from "../schemas/state.schema";

@Injectable()
export class DrizzleStateRepository implements StateRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findAll(): Promise<State[]> {
    const rows = await this.drizzle.db
      .select()
      .from(statesSchema)
      .orderBy(statesSchema.name);

    return rows.map(
      (row) => State.restore({ id: row.id, name: row.name, abbreviation: row.abbreviation })!,
    );
  }
}
