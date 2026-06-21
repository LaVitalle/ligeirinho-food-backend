import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { UserRole } from "@shared/domain/enums/user-role.enum";
import { Public } from "@shared/infra/decorators/public.decorator";
import { ResponseMessage } from "@shared/infra/decorators/response-message.decorator";
import { Roles } from "@shared/infra/decorators/roles.decorator";
import { HateoasItem } from "@shared/infra/hateoas/hateoas-item.decorator";
import { HateoasList } from "@shared/infra/hateoas/hateoas-list.decorator";
import { ApiWrappedResponse } from "@shared/infra/swagger/api-response.dto";
import {
  CreateIconDto,
  IconResponseDto,
  UpdateIconDto,
} from "../../application/dto/icon.dto";
import { IconService } from "../../application/services/icon.service";

@ApiTags("Icons")
@Controller("icons")
export class IconController {
  constructor(private readonly iconService: IconService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("file"))
  @ApiOperation({ summary: "Cria ícone global (admin)" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        key: { type: "string", example: "snack" },
        name: { type: "string", example: "Salgados" },
        tag: { type: "string", example: "food" },
        file: { type: "string", format: "binary" },
      },
      required: ["key", "name", "file"],
    },
  })
  @ResponseMessage("Ícone criado com sucesso")
  @ApiWrappedResponse(IconResponseDto, { description: "Ícone criado" })
  async create(
    @Body() dto: CreateIconDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.iconService.create(dto, file);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: "Lista ícones (filtro por tag/busca)" })
  @ApiQuery({
    name: "tag",
    required: false,
    type: String,
    description: "Filtra ícones pela tag (ex: food, drink)",
    example: "food",
  })
  @ApiQuery({
    name: "search",
    required: false,
    type: String,
    description: "Busca textual no nome ou key do ícone",
    example: "salga",
  })
  @ResponseMessage("Ícones listados com sucesso")
  @ApiWrappedResponse(IconResponseDto, {
    isArray: true,
    description: "Lista de ícones",
  })
  @HateoasList<IconResponseDto>({
    basePath: "/icons",
    itemLinks: (i) => ({
      self: { href: `/icons/${i.id}`, method: "GET" },
      update: { href: `/icons/${i.id}`, method: "PUT" },
      delete: { href: `/icons/${i.id}`, method: "DELETE" },
    }),
  })
  async findAll(
    @Query("tag") tag?: string,
    @Query("search") search?: string,
  ) {
    return this.iconService.findAll({ tag, search });
  }

  @Get(":id")
  @Public()
  @ApiOperation({ summary: "Detalhe de um ícone" })
  @ApiParam({ name: "id", description: "UUID do ícone", example: "b3f1c2d4-5e6f-7a8b-9c0d-1e2f3a4b5c6d" })
  @ResponseMessage("Ícone encontrado")
  @ApiWrappedResponse(IconResponseDto, { description: "Detalhe do ícone" })
  @HateoasItem<IconResponseDto>({
    basePath: "/icons",
    itemLinks: (i) => ({
      self: { href: `/icons/${i.id}`, method: "GET" },
      update: { href: `/icons/${i.id}`, method: "PUT" },
      delete: { href: `/icons/${i.id}`, method: "DELETE" },
    }),
  })
  async findById(@Param("id", ParseUUIDPipe) id: string) {
    return this.iconService.findById(id);
  }

  @Put(":id")
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("file"))
  @ApiOperation({ summary: "Atualiza ícone (key imutável)" })
  @ApiParam({ name: "id", description: "UUID do ícone", example: "b3f1c2d4-5e6f-7a8b-9c0d-1e2f3a4b5c6d" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        name: { type: "string", example: "Bebidas", description: "Novo nome do ícone" },
        tag: { type: "string", example: "drink", description: "Nova tag de agrupamento" },
        file: { type: "string", format: "binary", description: "Nova imagem SVG/PNG do ícone" },
      },
    },
  })
  @ResponseMessage("Ícone atualizado com sucesso")
  @ApiWrappedResponse(IconResponseDto, { description: "Ícone atualizado" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateIconDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.iconService.update(id, dto, file);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Remove ícone (bloqueia se em uso)" })
  @ApiParam({ name: "id", description: "UUID do ícone", example: "b3f1c2d4-5e6f-7a8b-9c0d-1e2f3a4b5c6d" })
  @ResponseMessage("Ícone removido com sucesso")
  async remove(@Param("id", ParseUUIDPipe) id: string) {
    await this.iconService.remove(id);
    return null;
  }
}
