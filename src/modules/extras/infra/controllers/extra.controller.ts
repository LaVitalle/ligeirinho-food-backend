import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { UserRole } from "@shared/domain/enums/user-role.enum";
import { CurrentUser } from "@shared/infra/decorators/current-user.decorator";
import { Public } from "@shared/infra/decorators/public.decorator";
import { ResponseMessage } from "@shared/infra/decorators/response-message.decorator";
import { Roles } from "@shared/infra/decorators/roles.decorator";
import { ApiWrappedResponse } from "@shared/infra/swagger/api-response.dto";
import { User } from "../../../users/domain/models/user";
import {
  AddExtrasToProductDto,
  CreateExtraDto,
  ExtraResponseDto,
  SetRemovableIngredientsDto,
  UpdateExtraDto,
} from "../../application/dto/extra.dto";
import { ExtraService } from "../../application/services/extra.service";

@ApiTags("Extras")
@ApiBearerAuth()
@Controller()
export class ExtraController {
  constructor(private readonly extraService: ExtraService) {}

  @Post("extras")
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: "Cria adicional na cantina" })
  @ResponseMessage("Adicional criado com sucesso")
  @ApiWrappedResponse(ExtraResponseDto, { description: "Adicional criado" })
  async create(@Body() dto: CreateExtraDto, @CurrentUser() user: User) {
    return this.extraService.create(dto, user);
  }

  @Get("extras")
  @Public()
  @ApiOperation({ summary: "Lista adicionais por cantina" })
  @ResponseMessage("Adicionais listados")
  @ApiWrappedResponse(ExtraResponseDto, { isArray: true, description: "Adicionais" })
  async findAll(
    @Query("canteenId") canteenId: string,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("perPage", new DefaultValuePipe(10), ParseIntPipe) perPage: number,
  ) {
    return this.extraService.findAll(page, perPage, canteenId);
  }

  @Put("extras/:id")
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: "Atualiza adicional" })
  @ResponseMessage("Adicional atualizado")
  @ApiWrappedResponse(ExtraResponseDto, { description: "Adicional atualizado" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateExtraDto,
    @CurrentUser() user: User,
  ) {
    return this.extraService.update(id, dto, user);
  }

  @Delete("extras/:id")
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: "Soft delete do adicional" })
  @ResponseMessage("Adicional removido")
  async remove(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    await this.extraService.remove(id, user);
    return null;
  }

  // Product-Extra N:N
  @Post("products/:productId/extras")
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: "Vincula extras ao produto" })
  @ResponseMessage("Extras vinculados")
  async addToProduct(
    @Param("productId", ParseUUIDPipe) productId: string,
    @Body() dto: AddExtrasToProductDto,
  ) {
    await this.extraService.addToProduct(productId, dto.extraIds);
    return null;
  }

  @Delete("products/:productId/extras/:extraId")
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: "Remove vínculo de extra do produto" })
  @ResponseMessage("Vínculo removido")
  async removeFromProduct(
    @Param("productId", ParseUUIDPipe) productId: string,
    @Param("extraId", ParseUUIDPipe) extraId: string,
  ) {
    await this.extraService.removeFromProduct(productId, extraId);
    return null;
  }

  @Get("products/:productId/extras")
  @Public()
  @ApiOperation({ summary: "Lista extras vinculados ao produto" })
  @ResponseMessage("Extras do produto")
  @ApiWrappedResponse(ExtraResponseDto, { isArray: true, description: "Extras do produto" })
  async findByProduct(@Param("productId", ParseUUIDPipe) productId: string) {
    return this.extraService.findByProduct(productId, true);
  }

  // Removable ingredients
  @Post("products/:productId/removable-ingredients")
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: "Define ingredientes removíveis (substitui em batch)" })
  @ResponseMessage("Ingredientes atualizados")
  async setRemovableIngredients(
    @Param("productId", ParseUUIDPipe) productId: string,
    @Body() dto: SetRemovableIngredientsDto,
  ) {
    return this.extraService.setRemovableIngredients(productId, dto.names);
  }

  @Get("products/:productId/removable-ingredients")
  @Public()
  @ApiOperation({ summary: "Lista ingredientes removíveis do produto" })
  @ResponseMessage("Ingredientes removíveis")
  async findRemovableIngredients(
    @Param("productId", ParseUUIDPipe) productId: string,
  ) {
    return this.extraService.findRemovableIngredients(productId);
  }
}
