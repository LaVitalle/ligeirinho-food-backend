import { PaginatedResult } from "@shared/application/dto/paginated-result";
import { Canteen } from "../models/canteen";

export const CANTEEN_REPOSITORY = Symbol("CANTEEN_REPOSITORY");

export interface CanteenRepository {
  create(data: {
    institutionId: string;
    name: string;
    cnpj?: string | null;
    block?: string | null;
    room?: string | null;
    logoUrl?: string | null;
  }): Promise<Canteen>;

  findById(id: string): Promise<Canteen | null>;

  findAll(
    page: number,
    perPage: number,
    filters?: {
      institutionId?: string;
      search?: string;
    },
  ): Promise<PaginatedResult<Canteen>>;

  update(
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
  ): Promise<Canteen>;

  delete(id: string): Promise<void>;

  count(institutionId?: string): Promise<number>;
}
