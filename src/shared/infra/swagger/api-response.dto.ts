import { Type, applyDecorators } from "@nestjs/common";
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiProperty,
  getSchemaPath,
} from "@nestjs/swagger";
import { PaginationDto } from "../../application/dto/paginated-result";

export class StatusDto {
  @ApiProperty({ example: 200 })
  code: number;

  @ApiProperty({ example: "Success" })
  message: string;
}

export class ApiResponseDto<T> {
  data: T;

  @ApiProperty({ type: StatusDto })
  status: StatusDto;

  @ApiProperty({ type: PaginationDto, required: false })
  pagination: PaginationDto | Record<string, never>;
}

export const ApiWrappedResponse = <TModel extends Type>(
  model: TModel,
  options?: { isArray?: boolean; description?: string },
) => {
  const { isArray = false, description } = options ?? {};

  const dataSchema = isArray
    ? { type: "array", items: { $ref: getSchemaPath(model) } }
    : { $ref: getSchemaPath(model) };

  return applyDecorators(
    ApiExtraModels(ApiResponseDto, model),
    ApiOkResponse({
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiResponseDto) },
          { properties: { data: dataSchema } },
        ],
      },
    }),
  );
};
