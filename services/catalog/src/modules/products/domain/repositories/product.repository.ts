import { PaginatedResult } from "@shared/application/dto/paginated-result";
import { Product } from "../models/product";

export const PRODUCT_REPOSITORY = Symbol("PRODUCT_REPOSITORY");

export interface ProductListFilters {
  canteenId: string;
  categoryId?: string;
  search?: string;
  onlyActive?: boolean;
}

export interface ProductRepository {
  create(data: {
    canteenId: string;
    categoryId: string;
    name: string;
    description?: string | null;
    price: string;
    photoUrl?: string | null;
  }): Promise<Product>;

  findById(id: string): Promise<Product | null>;

  findAll(
    page: number,
    perPage: number,
    filters: ProductListFilters,
  ): Promise<PaginatedResult<Product>>;

  update(
    id: string,
    data: Partial<{
      categoryId: string;
      name: string;
      description: string | null;
      price: string;
      photoUrl: string | null;
      isActive: boolean;
      isFeatured: boolean;
      deletedAt: Date | null;
    }>,
  ): Promise<Product>;

  delete(id: string): Promise<void>;

  findFeatured(institutionId?: string, limit?: number): Promise<Product[]>;
}
