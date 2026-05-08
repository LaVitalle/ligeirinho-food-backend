import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
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
import { CurrentUser } from "@shared/infra/decorators/current-user.decorator";
import { Public } from "@shared/infra/decorators/public.decorator";
import { ResponseMessage } from "@shared/infra/decorators/response-message.decorator";
import { Roles } from "@shared/infra/decorators/roles.decorator";
import { ApiWrappedResponse } from "@shared/infra/swagger/api-response.dto";
import { User } from "../../../users/domain/models/user";
import {
  CreateProductDto,
  ProductResponseDto,
  UpdateProductDto,
} from "../../application/dto/product.dto";
import { ProductService } from "../../application/services/product.service";

@ApiTags("Products")
@ApiBearerAuth()
@Controller("products")
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: "Cria produto na cantina do SELLER" })
  @ResponseMessage("Produto criado com sucesso")
  @ApiWrappedResponse(ProductResponseDto, { description: "Produto criado" })
  async create(@Body() dto: CreateProductDto, @CurrentUser() user: User) {
    return this.productService.create(dto, user);
  }

  @Get("featured")
  @Public()
  @ApiOperation({ summary: "Lista destaques (isFeatured)" })
  @ResponseMessage("Destaques listados")
  @ApiWrappedResponse(ProductResponseDto, { isArray: true, description: "Destaques" })
  async featured(
    @Query("institutionId") institutionId?: string,
    @Query("limit", new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    return this.productService.findFeatured(institutionId, limit);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: "Lista produtos filtrados por cantina" })
  @ResponseMessage("Produtos listados com sucesso")
  @ApiWrappedResponse(ProductResponseDto, { isArray: true, description: "Produtos" })
  async findAll(
    @Query("canteenId") canteenId: string,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("perPage", new DefaultValuePipe(10), ParseIntPipe) perPage: number,
    @Query("categoryId") categoryId?: string,
    @Query("search") search?: string,
    @Query("onlyActive", new DefaultValuePipe(true), ParseBoolPipe) onlyActive?: boolean,
  ) {
    return this.productService.findAll(
      page,
      perPage,
      canteenId,
      categoryId,
      search,
      onlyActive,
    );
  }

  @Get(":id")
  @Public()
  @ApiOperation({ summary: "Detalhe do produto" })
  @ResponseMessage("Produto encontrado")
  @ApiWrappedResponse(ProductResponseDto, { description: "Produto" })
  async findById(@Param("id", ParseUUIDPipe) id: string) {
    return this.productService.findById(id);
  }

  @Put(":id")
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: "Atualiza produto" })
  @ResponseMessage("Produto atualizado com sucesso")
  @ApiWrappedResponse(ProductResponseDto, { description: "Produto atualizado" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: User,
  ) {
    return this.productService.update(id, dto, user);
  }

  @Delete(":id")
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: "Soft delete do produto" })
  @ResponseMessage("Produto removido com sucesso")
  async remove(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    await this.productService.remove(id, user);
    return null;
  }

  @Post(":id/photo")
  @Roles(UserRole.SELLER)
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("photo"))
  @ApiOperation({ summary: "Upload de foto do produto" })
  @ResponseMessage("Foto atualizada com sucesso")
  @ApiWrappedResponse(ProductResponseDto, { description: "Produto com foto" })
  async uploadPhoto(
    @Param("id", ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: User,
  ) {
    return this.productService.uploadPhoto(id, file, user);
  }

  @Patch(":id/feature")
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: "Marca produto como destaque" })
  @ResponseMessage("Produto marcado como destaque")
  @ApiWrappedResponse(ProductResponseDto, { description: "Produto destaque" })
  async feature(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.productService.feature(id, user);
  }

  @Patch(":id/unfeature")
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: "Remove destaque do produto" })
  @ResponseMessage("Destaque removido")
  @ApiWrappedResponse(ProductResponseDto, { description: "Produto sem destaque" })
  async unfeature(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.productService.unfeature(id, user);
  }
}
