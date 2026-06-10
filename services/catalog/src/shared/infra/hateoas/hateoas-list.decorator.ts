import { SetMetadata } from "@nestjs/common";
import type { LinksMap } from "./hateoas.types";

export const HATEOAS_LIST_KEY = "hateoas:list";

export interface HateoasListOptions<T = Record<string, unknown>> {
  basePath: string;
  itemLinks: (item: T) => LinksMap;
}

/**
 * Marca um endpoint que retorna uma coleção paginada (PaginatedResult).
 * O TransformInterceptor injeta `_links` em cada item e `_links` de navegação
 * (self/first/next/prev/create) no nível da coleção.
 */
export const HateoasList = <T>(options: HateoasListOptions<T>) =>
  SetMetadata(HATEOAS_LIST_KEY, options);
