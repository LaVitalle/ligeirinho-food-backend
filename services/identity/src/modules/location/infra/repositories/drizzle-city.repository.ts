import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DrizzleService } from "@shared/infra/database/drizzle.service";
import { City } from "../../domain/models/city";
import { CityRepository } from "../../domain/repositories/city.repository";
import { citiesSchema } from "../schemas/city.schema";

@Injectable()
export class DrizzleCityRepository implements CityRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findByStateId(stateId: number): Promise<City[]> {
    const rows = await this.drizzle.db
      .select()
      .from(citiesSchema)
      .where(eq(citiesSchema.stateId, stateId))
      .orderBy(citiesSchema.name);

    return rows.map(
      (row) => City.restore({ id: row.id, name: row.name, stateId: row.stateId })!,
    );
  }
}
