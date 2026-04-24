import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { PaginatedResult } from "@shared/application/dto/paginated-result";
import { DrizzleService } from "@shared/infra/database/drizzle.service";
import { Institution } from "../../domain/models/institution";
import {
  InstitutionRepository,
  InstitutionWithLocation,
} from "../../domain/repositories/institution.repository";
import { citiesSchema } from "../../../location/infra/schemas/city.schema";
import { statesSchema } from "../../../location/infra/schemas/state.schema";
import { institutionsSchema } from "../schemas/institution.schema";

@Injectable()
export class DrizzleInstitutionRepository implements InstitutionRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async create(data: {
    name: string;
    accessCode: string;
    photoUrl?: string | null;
    stateId: number;
    cityId: number;
  }): Promise<Institution> {
    const [row] = await this.drizzle.db
      .insert(institutionsSchema)
      .values({
        name: data.name,
        accessCode: data.accessCode,
        photoUrl: data.photoUrl ?? null,
        stateId: data.stateId,
        cityId: data.cityId,
      })
      .returning();

    return Institution.restore({
      id: row.id,
      name: row.name,
      photoUrl: row.photoUrl ?? null,
      accessCode: row.accessCode,
      stateId: row.stateId,
      cityId: row.cityId,
      createdAt: row.createdAt as unknown as Date,
      updatedAt: row.updatedAt as unknown as Date,
    })!;
  }

  async findAll(
    page: number,
    perPage: number,
  ): Promise<PaginatedResult<InstitutionWithLocation>> {
    const offset = (page - 1) * perPage;

    const rows = await this.drizzle.db
      .select({
        institution: institutionsSchema,
        stateName: statesSchema.name,
        cityName: citiesSchema.name,
      })
      .from(institutionsSchema)
      .leftJoin(statesSchema, eq(institutionsSchema.stateId, statesSchema.id))
      .leftJoin(citiesSchema, eq(institutionsSchema.cityId, citiesSchema.id))
      .orderBy(institutionsSchema.name)
      .limit(perPage + 1)
      .offset(offset);

    const mapped: InstitutionWithLocation[] = rows.map((row) => ({
      institution: Institution.restore({
        id: row.institution.id,
        name: row.institution.name,
        photoUrl: row.institution.photoUrl ?? null,
        accessCode: row.institution.accessCode,
        stateId: row.institution.stateId,
        cityId: row.institution.cityId,
        createdAt: row.institution.createdAt as unknown as Date,
        updatedAt: row.institution.updatedAt as unknown as Date,
      })!,
      stateName: row.stateName ?? null,
      cityName: row.cityName ?? null,
    }));

    return PaginatedResult.fromRows(mapped, page, perPage);
  }

  async findById(id: string): Promise<InstitutionWithLocation | null> {
    const rows = await this.drizzle.db
      .select({
        institution: institutionsSchema,
        stateName: statesSchema.name,
        cityName: citiesSchema.name,
      })
      .from(institutionsSchema)
      .leftJoin(statesSchema, eq(institutionsSchema.stateId, statesSchema.id))
      .leftJoin(citiesSchema, eq(institutionsSchema.cityId, citiesSchema.id))
      .where(eq(institutionsSchema.id, id))
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    return {
      institution: Institution.restore({
        id: row.institution.id,
        name: row.institution.name,
        photoUrl: row.institution.photoUrl ?? null,
        accessCode: row.institution.accessCode,
        stateId: row.institution.stateId,
        cityId: row.institution.cityId,
        createdAt: row.institution.createdAt as unknown as Date,
        updatedAt: row.institution.updatedAt as unknown as Date,
      })!,
      stateName: row.stateName ?? null,
      cityName: row.cityName ?? null,
    };
  }

  async findByAccessCode(accessCode: string): Promise<Institution | null> {
    const rows = await this.drizzle.db
      .select()
      .from(institutionsSchema)
      .where(eq(institutionsSchema.accessCode, accessCode))
      .limit(1);

    const row = rows[0];
    return Institution.restore(
      row && {
        id: row.id,
        name: row.name,
        photoUrl: row.photoUrl ?? null,
        accessCode: row.accessCode,
        stateId: row.stateId,
        cityId: row.cityId,
        createdAt: row.createdAt as unknown as Date,
        updatedAt: row.updatedAt as unknown as Date,
      },
    );
  }

  async update(
    id: string,
    data: {
      name?: string;
      photoUrl?: string | null;
      stateId?: number;
      cityId?: number;
    },
  ): Promise<Institution> {
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (data.name !== undefined) patch.name = data.name;
    if (data.photoUrl !== undefined) patch.photoUrl = data.photoUrl;
    if (data.stateId !== undefined) patch.stateId = data.stateId;
    if (data.cityId !== undefined) patch.cityId = data.cityId;

    const [row] = await this.drizzle.db
      .update(institutionsSchema)
      .set(patch)
      .where(eq(institutionsSchema.id, id))
      .returning();

    return Institution.restore({
      id: row.id,
      name: row.name,
      photoUrl: row.photoUrl ?? null,
      accessCode: row.accessCode,
      stateId: row.stateId,
      cityId: row.cityId,
      createdAt: row.createdAt as unknown as Date,
      updatedAt: row.updatedAt as unknown as Date,
    })!;
  }

  async delete(id: string): Promise<void> {
    await this.drizzle.db
      .delete(institutionsSchema)
      .where(eq(institutionsSchema.id, id));
  }

  async existsByAccessCode(accessCode: string): Promise<boolean> {
    const rows = await this.drizzle.db
      .select({ id: institutionsSchema.id })
      .from(institutionsSchema)
      .where(eq(institutionsSchema.accessCode, accessCode))
      .limit(1);

    return rows.length > 0;
  }
}
