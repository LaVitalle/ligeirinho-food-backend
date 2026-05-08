import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { UserRole } from "@shared/domain/enums/user-role.enum";
import { CurrentUser } from "@shared/infra/decorators/current-user.decorator";
import { ResponseMessage } from "@shared/infra/decorators/response-message.decorator";
import { Roles } from "@shared/infra/decorators/roles.decorator";
import { ApiWrappedResponse } from "@shared/infra/swagger/api-response.dto";
import { User } from "../../../users/domain/models/user";
import {
  CancelOrderDto,
  OrderResponseDto,
  RateOrderDto,
} from "../../application/dto/order.dto";
import { OrderService } from "../../application/services/order.service";

@ApiTags("Orders")
@ApiBearerAuth()
@Controller("orders")
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: "Cria pedido a partir do carrinho" })
  @ResponseMessage("Pedido criado com sucesso")
  @ApiWrappedResponse(OrderResponseDto, { description: "Pedido criado" })
  async create(@CurrentUser() user: User) {
    return this.orderService.createFromCart(user);
  }

  @Get("me")
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: "Pedidos do cliente (open/history)" })
  @ResponseMessage("Pedidos listados")
  @ApiWrappedResponse(OrderResponseDto, { isArray: true, description: "Pedidos" })
  async findByUser(
    @CurrentUser() user: User,
    @Query("status", new DefaultValuePipe("open")) status: string,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("perPage", new DefaultValuePipe(10), ParseIntPipe) perPage: number,
  ) {
    return this.orderService.findByUser(user.id, status, page, perPage);
  }

  @Get("canteen")
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: "Fila de pedidos da cantina" })
  @ResponseMessage("Pedidos da cantina listados")
  @ApiWrappedResponse(OrderResponseDto, { isArray: true, description: "Pedidos" })
  async findByCanteen(
    @CurrentUser() user: User,
    @Query("status", new DefaultValuePipe("")) status: string,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("perPage", new DefaultValuePipe(10), ParseIntPipe) perPage: number,
  ) {
    return this.orderService.findByCanteen(
      user.canteenId!,
      status,
      page,
      perPage,
    );
  }

  @Get(":id")
  @ApiOperation({ summary: "Detalhe do pedido" })
  @ResponseMessage("Pedido encontrado")
  @ApiWrappedResponse(OrderResponseDto, { description: "Pedido" })
  async findById(@Param("id", ParseUUIDPipe) id: string) {
    return this.orderService.findById(id);
  }

  @Patch(":id/advance")
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: "Avança status do pedido" })
  @ResponseMessage("Status avançado")
  @ApiWrappedResponse(OrderResponseDto, { description: "Pedido atualizado" })
  async advance(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.orderService.advance(id, user);
  }

  @Patch(":id/pickup")
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: "Confirma retirada (JÁ RETIREI)" })
  @ResponseMessage("Retirada confirmada")
  @ApiWrappedResponse(OrderResponseDto, { description: "Pedido retirado" })
  async pickup(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.orderService.pickup(id, user);
  }

  @Patch(":id/cancel")
  @Roles(UserRole.CUSTOMER, UserRole.SELLER)
  @ApiOperation({ summary: "Cancela pedido" })
  @ResponseMessage("Pedido cancelado")
  @ApiWrappedResponse(OrderResponseDto, { description: "Pedido cancelado" })
  async cancel(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: CancelOrderDto,
    @CurrentUser() user: User,
  ) {
    return this.orderService.cancel(id, user, dto.reason);
  }

  @Patch(":id/rating")
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: "Avalia pedido (1-5)" })
  @ResponseMessage("Avaliação registrada")
  async rate(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: RateOrderDto,
    @CurrentUser() user: User,
  ) {
    await this.orderService.rate(id, user, dto.rating, dto.comment);
    return null;
  }
}
