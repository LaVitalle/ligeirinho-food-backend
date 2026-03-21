import { ApiProperty } from "@nestjs/swagger";

export class PaginationDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  perPage: number;

  @ApiProperty({ example: true })
  hasNextPage: boolean;
}

export class PaginatedResult<T> {
  readonly items: T[];
  readonly page: number;
  readonly perPage: number;
  readonly hasNextPage: boolean;

  private constructor(
    items: T[],
    page: number,
    perPage: number,
    hasNextPage: boolean,
  ) {
    this.items = items;
    this.page = page;
    this.perPage = perPage;
    this.hasNextPage = hasNextPage;
  }

  /**
   * Recebe os rows retornados do banco (com perPage + 1 registros).
   * Se vieram mais que perPage, existe próxima página.
   */
  static fromRows<T>(
    rows: T[],
    page: number,
    perPage: number,
  ): PaginatedResult<T> {
    const hasNextPage = rows.length > perPage;
    const items = hasNextPage ? rows.slice(0, perPage) : rows;
    return new PaginatedResult(items, page, perPage, hasNextPage);
  }
}
