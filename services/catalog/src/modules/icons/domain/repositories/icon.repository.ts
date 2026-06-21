import { Icon } from "../models/icon";

export const ICON_REPOSITORY = Symbol("ICON_REPOSITORY");

export interface IconRepository {
  create(data: {
    key: string;
    name: string;
    url: string;
    tag?: string | null;
  }): Promise<Icon>;

  findAll(filters?: { tag?: string; search?: string }): Promise<Icon[]>;
  findById(id: string): Promise<Icon | null>;
  findByKey(key: string): Promise<Icon | null>;

  update(
    id: string,
    data: Partial<{
      name: string;
      url: string;
      tag: string | null;
    }>,
  ): Promise<Icon>;

  delete(id: string): Promise<void>;
  isKeyInUse(key: string): Promise<boolean>;
}
