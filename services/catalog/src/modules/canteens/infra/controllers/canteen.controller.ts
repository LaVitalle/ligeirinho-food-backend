import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { UserRole } from "@shared/domain/enums/user-role.enum";
import { AuthenticatedUser } from "@shared/infra/auth/authenticated-user.interface";
import { CurrentUser } from "@shared/infra/decorators/current-user.decorator";
import { HateoasItem } from "@shared/infra/hateoas/hateoas-item.decorator";
import { HateoasList } from "@shared/infra/hateoas/hateoas-list.decorator";
import { ResponseMessage } from "@shared/infra/decorators/response-message.decorator";
import { Roles } from "@shared/infra/decorators/roles.decorator";
import { ApiWrappedResponse } from "@shared/infra/swagger/api-response.dto";
import { CreateCanteenDto } from "../../application/dto/create-canteen.dto";
import { UpdateCanteenDto } from "../../application/dto/update-canteen.dto";
import { CanteenResponseDto } from "../../application/dto/canteen-response.dto";
import { CanteenService } from "../../application/services/canteen.service";

@ApiTags("Canteens")
@ApiBearerAuth()
@Controller("canteens")
export class CanteenController {
  constructor(private readonly canteenService: CanteenService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({ summary: "Cria cantina + SELLER vinculado (atômico)" })
  @ResponseMessage("Cantina criada com sucesso")
  @ApiWrappedResponse(CanteenResponseDto, { description: "Cantina criada" })
  async create(
    @Body() dto: CreateCanteenDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.canteenService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: "Lista cantinas paginadas" })
  @ResponseMessage("Cantinas listadas com sucesso")
  @ApiWrappedResponse(CanteenResponseDto, {
    isArray: true,
    description: "Lista paginada de cantinas",
  })
  @HateoasList<CanteenResponseDto>({
    basePath: "/canteens",
    itemLinks: (c) => ({
      self: { href: `/canteens/${c.id}`, method: "GET" },
      products: { href: `/products?canteenId=${c.id}`, method: "GET" },
    }),
  })
  async findAll(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("perPage", new DefaultValuePipe(10), ParseIntPipe) perPage: number,
    @Query("institutionId") institutionId?: string,
    @Query("search") search?: string,
  ) {
    return this.canteenService.findAll(page, perPage, {
      institutionId,
      search,
    });
  }

  @Get("count")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Contagem total de cantinas" })
  @ResponseMessage("Contagem de cantinas")
  async count(@Query("institutionId") institutionId?: string) {
    return this.canteenService.count(institutionId);
  }

  @Get("me")
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: "Cantina do SELLER logado" })
  @ResponseMessage("Cantina encontrada")
  @ApiWrappedResponse(CanteenResponseDto, { description: "Cantina do SELLER" })
  async findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.canteenService.findById(user.canteenId!);
  }

  @Patch("me")
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: "Edita perfil da cantina do SELLER logado" })
  @ResponseMessage("Cantina atualizada com sucesso")
  @ApiWrappedResponse(CanteenResponseDto, { description: "Cantina atualizada" })
  async updateMine(
    @Body() dto: UpdateCanteenDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.canteenService.update(user.canteenId!, dto, user);
  }

  @Get(":id")
  @ApiOperation({ summary: "Detalhe de uma cantina" })
  @ResponseMessage("Cantina encontrada")
  @ApiWrappedResponse(CanteenResponseDto, { description: "Detalhe da cantina" })
  @HateoasItem<CanteenResponseDto>({
    basePath: "/canteens",
    itemLinks: (c) => ({
      self: { href: `/canteens/${c.id}`, method: "GET" },
      update: { href: `/canteens/${c.id}`, method: "PUT" },
      delete: { href: `/canteens/${c.id}`, method: "DELETE" },
      products: { href: `/products?canteenId=${c.id}`, method: "GET" },
    }),
  })
  async findById(@Param("id", ParseUUIDPipe) id: string) {
    return this.canteenService.findById(id);
  }

  @Put(":id")
  @Roles(UserRole.ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.SELLER)
  @ApiOperation({ summary: "Atualiza dados da cantina" })
  @ResponseMessage("Cantina atualizada com sucesso")
  @ApiWrappedResponse(CanteenResponseDto, { description: "Cantina atualizada" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateCanteenDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.canteenService.update(id, dto, user);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({ summary: "Soft delete da cantina e do SELLER vinculado" })
  @ResponseMessage("Cantina removida com sucesso")
  async remove(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.canteenService.remove(id, user);
    return null;
  }

  @Patch(":id/toggle-open")
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: "Alterna isOpen da cantina" })
  @ResponseMessage("Status da cantina atualizado")
  @ApiWrappedResponse(CanteenResponseDto, { description: "Cantina com isOpen alternado" })
  async toggleOpen(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.canteenService.toggleOpen(id, user);
  }

  @Post(":id/logo")
  @Roles(UserRole.ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.SELLER)
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("logo"))
  @ApiOperation({ summary: "Upload da logo da cantina" })
  @ResponseMessage("Logo atualizada com sucesso")
  @ApiWrappedResponse(CanteenResponseDto, { description: "Cantina com logo atualizada" })
  async uploadLogo(
    @Param("id", ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.canteenService.uploadLogo(id, file, user);
  }
}
