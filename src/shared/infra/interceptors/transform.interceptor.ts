import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable, map } from "rxjs";
import { PaginatedResult } from "../../application/dto/paginated-result";
import { RESPONSE_MESSAGE_KEY } from "../decorators/response-message.decorator";

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const message =
      this.reflector.get<string>(RESPONSE_MESSAGE_KEY, context.getHandler()) ??
      "Success";

    const code = context.switchToHttp().getResponse().statusCode;

    return next.handle().pipe(
      map((data) => {
        const isPaginated = data instanceof PaginatedResult;

        return {
          data: isPaginated ? data.items : data,
          status: { code, message },
          pagination: isPaginated
            ? {
                page: data.page,
                perPage: data.perPage,
                hasNextPage: data.hasNextPage,
              }
            : {},
        };
      }),
    );
  }
}
