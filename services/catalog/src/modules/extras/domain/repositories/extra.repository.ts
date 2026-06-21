import { PaginatedResult } from "@shared/application/dto/paginated-result";
import { Extra } from "../models/extra";

export const EXTRA_REPOSITORY = Symbol("EXTRA_REPOSITORY");

export interface ExtraRepository {
  create(data: {
    canteenId: string;
    name: string;
    price: string;
  }): Promise<Extra>;

  findById(id: string): Promise<Extra | null>;

  findAll(
    page: number,
    perPage: number,
    canteenId: string,
  ): Promise<PaginatedResult<Extra>>;

  update(
    id: string,
    data: Partial<{ name: string; price: string; isActive: boolean }>,
  ): Promise<Extra>;

  delete(id: string): Promise<void>;

  addToProduct(productId: string, extraId: string): Promise<void>;
  removeFromProduct(productId: string, extraId: string): Promise<void>;
  findByProduct(productId: string, onlyActive?: boolean): Promise<Extra[]>;

  setRemovableIngredients(
    productId: string,
    names: string[],
  ): Promise<{ id: string; name: string }[]>;
  findRemovableIngredients(
    productId: string,
  ): Promise<{ id: string; name: string }[]>;
}
