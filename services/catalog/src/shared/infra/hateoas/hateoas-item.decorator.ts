import { SetMetadata } from "@nestjs/common";
import type { LinksMap } from "./hateoas.types";

export const HATEOAS_ITEM_KEY = "hateoas:item";

export interface HateoasItemOptions<T = Record<string, unknown>> {
  basePath: string;
  itemLinks: (item: T) => LinksMap;
}

/**
 * Marca um endpoint que retorna UM recurso. O TransformInterceptor injeta
 * `_links` dentro do objeto `data`.
 */
export const HateoasItem = <T>(options: HateoasItemOptions<T>) =>
  SetMetadata(HATEOAS_ITEM_KEY, options);
