import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { Observable, map } from "rxjs";
import { PaginatedResult } from "@shared/application/dto/paginated-result";
import { RESPONSE_MESSAGE_KEY } from "@shared/infra/decorators/response-message.decorator";
import {
  HATEOAS_ITEM_KEY,
  type HateoasItemOptions,
} from "@shared/infra/hateoas/hateoas-item.decorator";
import {
  HATEOAS_LIST_KEY,
  type HateoasListOptions,
} from "@shared/infra/hateoas/hateoas-list.decorator";
import type { LinksMap } from "@shared/infra/hateoas/hateoas.types";

/**
 * Envelope global de resposta: { data, status, pagination, _links? }.
 * Quando o handler é anotado com @HateoasItem/@HateoasList, injeta os links
 * de hipermídia (HATEOAS) no item e/ou na coleção.
 */
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const handler = context.getHandler();

    const message =
      this.reflector.get<string>(RESPONSE_MESSAGE_KEY, handler) ?? "Success";
    const itemOptions = this.reflector.get<HateoasItemOptions>(
      HATEOAS_ITEM_KEY,
      handler,
    );
    const listOptions = this.reflector.get<HateoasListOptions>(
      HATEOAS_LIST_KEY,
      handler,
    );

    const httpCtx = context.switchToHttp();
    const code = httpCtx.getResponse().statusCode;
    const request = httpCtx.getRequest<Request>();

    return next.handle().pipe(
      map((data) => {
        const isPaginated = data instanceof PaginatedResult;
        let payload: unknown = isPaginated ? data.items : data;
        let collectionLinks: LinksMap | undefined;

        if (isPaginated && listOptions) {
          payload = data.items.map((item) =>
            this.withItemLinks(item, listOptions.itemLinks),
          );
          collectionLinks = this.buildCollectionLinks(listOptions, data);
        } else if (!isPaginated && itemOptions && payload != null) {
          payload = this.withItemLinks(payload, itemOptions.itemLinks);
        }

        const body: Record<string, unknown> = {
          data: payload,
          status: { code, message },
          pagination: isPaginated
            ? {
                page: data.page,
                perPage: data.perPage,
                hasNextPage: data.hasNextPage,
              }
            : {},
        };

        if (collectionLinks) body._links = collectionLinks;
        return body;
      }),
    );
  }

  private withItemLinks(
    item: unknown,
    itemLinks: (item: Record<string, unknown>) => LinksMap,
  ): Record<string, unknown> {
    const record = item as Record<string, unknown>;
    return { ...record, _links: itemLinks(record) };
  }

  private buildCollectionLinks(
    options: HateoasListOptions,
    page: PaginatedResult<unknown>,
  ): LinksMap {
    const { basePath } = options;
    const { perPage } = page;
    const sep = basePath.includes("?") ? "&" : "?";

    return {
      self: {
        href: `${basePath}${sep}page=${page.page}&perPage=${perPage}`,
        method: "GET",
      },
      first: {
        href: `${basePath}${sep}page=1&perPage=${perPage}`,
        method: "GET",
      },
      next: page.hasNextPage
        ? {
            href: `${basePath}${sep}page=${page.page + 1}&perPage=${perPage}`,
            method: "GET",
          }
        : null,
      prev:
        page.page > 1
          ? {
              href: `${basePath}${sep}page=${page.page - 1}&perPage=${perPage}`,
              method: "GET",
            }
          : null,
      create: { href: basePath, method: "POST" },
    };
  }
}
