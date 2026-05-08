import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { UserRole } from "@shared/domain/enums/user-role.enum";
import { Public } from "@shared/infra/decorators/public.decorator";
import { ResponseMessage } from "@shared/infra/decorators/response-message.decorator";
import { Roles } from "@shared/infra/decorators/roles.decorator";
import { ApiWrappedResponse } from "@shared/infra/swagger/api-response.dto";
import {
  CategoryResponseDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from "../../application/dto/category.dto";
import { CategoryService } from "../../application/services/category.service";

@ApiTags("Categories")
@Controller("categories")
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Cria categoria global" })
  @ResponseMessage("Categoria criada com sucesso")
  @ApiWrappedResponse(CategoryResponseDto, { description: "Categoria criada" })
  async create(@Body() dto: CreateCategoryDto) {
    return this.categoryService.create(dto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: "Lista categorias ordenadas por displayOrder" })
  @ResponseMessage("Categorias listadas com sucesso")
  @ApiWrappedResponse(CategoryResponseDto, {
    isArray: true,
    description: "Lista de categorias",
  })
  async findAll() {
    return this.categoryService.findAll();
  }

  @Put(":id")
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Atualiza categoria" })
  @ResponseMessage("Categoria atualizada com sucesso")
  @ApiWrappedResponse(CategoryResponseDto, { description: "Categoria atualizada" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, dto);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Remove categoria (bloqueia se houver produtos)" })
  @ResponseMessage("Categoria removida com sucesso")
  async remove(@Param("id", ParseUUIDPipe) id: string) {
    await this.categoryService.remove(id);
    return null;
  }
}
