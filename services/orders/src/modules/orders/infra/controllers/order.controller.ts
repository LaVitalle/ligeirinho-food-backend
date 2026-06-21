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
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import type { AuthenticatedUser } from "@shared/infra/auth/authenticated-user.interface";
import { UserRole } from "@shared/domain/enums/user-role.enum";
import { CurrentUser } from "@shared/infra/decorators/current-user.decorator";
import { ResponseMessage } from "@shared/infra/decorators/response-message.decorator";
import { Roles } from "@shared/infra/decorators/roles.decorator";
import { ApiWrappedResponse } from "@shared/infra/swagger/api-response.dto";
import { HateoasItem } from "@shared/infra/hateoas/hateoas-item.decorator";
import { HateoasList } from "@shared/infra/hateoas/hateoas-list.decorator";
import type { LinksMap } from "@shared/infra/hateoas/hateoas.types";
import {
  canCancel,
  getNextStatus,
  OrderStatus,
} from "../../domain/models/order-status";
import {
  CancelOrderDto,
  CreateOrderDto,
  OrderResponseDto,
  RateOrderDto,
} from "../../application/dto/order.dto";
import { OrderService } from "../../application/services/order.service";

/** Constrói os links HATEOAS de um pedido conforme o status corrente. */
function orderLinks(order: { id: string; status: string }): LinksMap {
  const status = order.status as OrderStatus;
  const links: LinksMap = {
    self: { href: `/orders/${order.id}`, method: "GET" },
  };

  if (getNextStatus(status)) {
    links.advance = { href: `/orders/${order.id}/advance`, method: "PATCH" };
  }
  if (canCancel(status)) {
    links.cancel = { href: `/orders/${order.id}/cancel`, method: "PATCH" };
  }
  if (status === OrderStatus.AGUARDANDO_RETIRADA) {
    links.pickup = { href: `/orders/${order.id}/pickup`, method: "PATCH" };
  }
  if (status === OrderStatus.RETIRADO) {
    links.rate = { href: `/orders/${order.id}/rating`, method: "PATCH" };
  }

  return links;
}

@ApiTags("Orders")
@ApiBearerAuth()
@Controller("orders")
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: "Cria pedido a partir do carrinho" })
  @ApiBody({ type: CreateOrderDto })
  @ResponseMessage("Pedido criado com sucesso")
  @ApiWrappedResponse(OrderResponseDto, { description: "Pedido criado" })
  @HateoasItem<OrderResponseDto>({ basePath: "/orders", itemLinks: orderLinks })
  async create(
    @Body() dto: CreateOrderDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.orderService.createFromCart(user, dto.paymentMethodId);
  }

  @Get("me")
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: "Pedidos do cliente (open/history)" })
  @ApiQuery({
    name: "status",
    required: false,
    type: String,
    description: "Filtro de pedidos: \"open\" para pedidos em andamento, \"history\" para pedidos finalizados/cancelados",
    example: "open",
  })
  @ApiQuery({ name: "page", required: false, type: Number, description: "Número da página (default: 1)", example: 1 })
  @ApiQuery({ name: "perPage", required: false, type: Number, description: "Itens por página (default: 10)", example: 10 })
  @ResponseMessage("Pedidos listados")
  @ApiWrappedResponse(OrderResponseDto, { isArray: true, description: "Pedidos" })
  @HateoasList<OrderResponseDto>({ basePath: "/orders", itemLinks: orderLinks })
  async findByUser(
    @CurrentUser() user: AuthenticatedUser,
    @Query("status", new DefaultValuePipe("open")) status: string,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("perPage", new DefaultValuePipe(10), ParseIntPipe) perPage: number,
  ) {
    return this.orderService.findByUser(user.sub, status, page, perPage);
  }

  @Get("canteen")
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: "Fila de pedidos da cantina" })
  @ApiQuery({
    name: "status",
    required: false,
    type: String,
    description: "Filtro por status do pedido. Vazio retorna todos os status ativos (fila completa).",
    example: "AGUARDANDO_CONFIRMACAO",
  })
  @ApiQuery({ name: "page", required: false, type: Number, description: "Número da página (default: 1)", example: 1 })
  @ApiQuery({ name: "perPage", required: false, type: Number, description: "Itens por página (default: 10)", example: 10 })
  @ResponseMessage("Pedidos da cantina listados")
  @ApiWrappedResponse(OrderResponseDto, { isArray: true, description: "Pedidos" })
  @HateoasList<OrderResponseDto>({ basePath: "/orders", itemLinks: orderLinks })
  async findByCanteen(
    @CurrentUser() user: AuthenticatedUser,
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
  @ApiParam({ name: "id", description: "UUID do pedido", example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" })
  @ResponseMessage("Pedido encontrado")
  @ApiWrappedResponse(OrderResponseDto, { description: "Pedido" })
  @HateoasItem<OrderResponseDto>({ basePath: "/orders", itemLinks: orderLinks })
  async findById(@Param("id", ParseUUIDPipe) id: string) {
    return this.orderService.findById(id);
  }

  @Patch(":id/advance")
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: "Avança status do pedido" })
  @ApiParam({ name: "id", description: "UUID do pedido", example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" })
  @ResponseMessage("Status avançado")
  @ApiWrappedResponse(OrderResponseDto, { description: "Pedido atualizado" })
  @HateoasItem<OrderResponseDto>({ basePath: "/orders", itemLinks: orderLinks })
  async advance(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.orderService.advance(id, user);
  }

  @Patch(":id/pickup")
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: "Confirma retirada (JÁ RETIREI)" })
  @ApiParam({ name: "id", description: "UUID do pedido", example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" })
  @ResponseMessage("Retirada confirmada")
  @ApiWrappedResponse(OrderResponseDto, { description: "Pedido retirado" })
  @HateoasItem<OrderResponseDto>({ basePath: "/orders", itemLinks: orderLinks })
  async pickup(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.orderService.pickup(id, user);
  }

  @Patch(":id/cancel")
  @Roles(UserRole.CUSTOMER, UserRole.SELLER)
  @ApiOperation({ summary: "Cancela pedido" })
  @ApiParam({ name: "id", description: "UUID do pedido", example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" })
  @ApiBody({ type: CancelOrderDto })
  @ResponseMessage("Pedido cancelado")
  @ApiWrappedResponse(OrderResponseDto, { description: "Pedido cancelado" })
  @HateoasItem<OrderResponseDto>({ basePath: "/orders", itemLinks: orderLinks })
  async cancel(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: CancelOrderDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.orderService.cancel(id, user, dto.reason);
  }

  @Patch(":id/rating")
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: "Avalia pedido (1-5)" })
  @ApiParam({ name: "id", description: "UUID do pedido", example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" })
  @ApiBody({ type: RateOrderDto })
  @ResponseMessage("Avaliação registrada")
  async rate(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: RateOrderDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.orderService.rate(id, user, dto.rating, dto.comment);
    return null;
  }
}
