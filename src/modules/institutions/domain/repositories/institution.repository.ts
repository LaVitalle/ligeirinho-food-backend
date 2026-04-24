import { PaginatedResult } from "@shared/application/dto/paginated-result";
import { Institution } from "../models/institution";

export const INSTITUTION_REPOSITORY = Symbol("INSTITUTION_REPOSITORY");

export interface InstitutionWithLocation {
  institution: Institution;
  stateName: string | null;
  cityName: string | null;
}

export interface InstitutionRepository {
  create(data: {
    name: string;
    accessCode: string;
    photoUrl?: string | null;
    stateId: number;
    cityId: number;
  }): Promise<Institution>;

  findAll(
    page: number,
    perPage: number,
  ): Promise<PaginatedResult<InstitutionWithLocation>>;

  findById(id: string): Promise<InstitutionWithLocation | null>;

  findByAccessCode(accessCode: string): Promise<Institution | null>;

  update(
    id: string,
    data: {
      name?: string;
      photoUrl?: string | null;
      stateId?: number;
      cityId?: number;
    },
  ): Promise<Institution>;

  delete(id: string): Promise<void>;

  existsByAccessCode(accessCode: string): Promise<boolean>;
}
