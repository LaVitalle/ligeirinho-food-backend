import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { UserRole } from "@shared/domain/enums/user-role.enum";
import { CurrentUser } from "@shared/infra/decorators/current-user.decorator";
import { ResponseMessage } from "@shared/infra/decorators/response-message.decorator";
import { Roles } from "@shared/infra/decorators/roles.decorator";
import { User } from "../../../users/domain/models/user";
import { AddCartItemDto, UpdateCartItemDto } from "../../application/dto/cart.dto";
import { CartService } from "../../application/services/cart.service";

@ApiTags("Cart")
@ApiBearerAuth()
@Controller("cart")
@Roles(UserRole.CUSTOMER)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post("items")
  @ApiOperation({ summary: "Adiciona item ao carrinho" })
  @ResponseMessage("Item adicionado ao carrinho")
  async addItem(@Body() dto: AddCartItemDto, @CurrentUser() user: User) {
    await this.cartService.addItem(user.id, dto);
    return null;
  }

  @Get()
  @ApiOperation({ summary: "Lista itens do carrinho" })
  @ResponseMessage("Carrinho carregado")
  async getItems(@CurrentUser() user: User) {
    return this.cartService.getItems(user.id);
  }

  @Patch("items/:id")
  @ApiOperation({ summary: "Atualiza quantidade do item" })
  @ResponseMessage("Quantidade atualizada")
  async updateItem(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    await this.cartService.updateItem(id, dto);
    return null;
  }

  @Delete("items/:id")
  @ApiOperation({ summary: "Remove item do carrinho" })
  @ResponseMessage("Item removido")
  async removeItem(@Param("id", ParseUUIDPipe) id: string) {
    await this.cartService.removeItem(id);
    return null;
  }

  @Delete()
  @ApiOperation({ summary: "Limpa o carrinho" })
  @ResponseMessage("Carrinho esvaziado")
  async clear(@CurrentUser() user: User) {
    await this.cartService.clear(user.id);
    return null;
  }
}
