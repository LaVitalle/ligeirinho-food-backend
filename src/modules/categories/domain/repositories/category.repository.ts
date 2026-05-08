import { Category } from "../models/category";

export const CATEGORY_REPOSITORY = Symbol("CATEGORY_REPOSITORY");

export interface CategoryRepository {
  create(data: {
    name: string;
    iconKey?: string | null;
    displayOrder?: number;
  }): Promise<Category>;

  findAll(): Promise<Category[]>;
  findById(id: string): Promise<Category | null>;

  update(
    id: string,
    data: Partial<{
      name: string;
      iconKey: string | null;
      displayOrder: number;
    }>,
  ): Promise<Category>;

  delete(id: string): Promise<void>;
  hasProducts(id: string): Promise<boolean>;
}
