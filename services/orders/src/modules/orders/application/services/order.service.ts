import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PaginatedResult } from "@shared/application/dto/paginated-result";
import type { AuthenticatedUser } from "@shared/infra/auth/authenticated-user.interface";
import { UserRole } from "@shared/domain/enums/user-role.enum";
import {
  CART_REPOSITORY,
  CartRepository,
} from "../../../cart/domain/repositories/cart.repository";
import { CanteenViewRepository } from "../../../projections/infra/repositories/canteen-view.repository";
import {
  OrderStatus,
  canCancel,
  getNextStatus,
} from "../../domain/models/order-status";
import {
  ORDER_REPOSITORY,
  OrderRepository,
  OrderRow,
} from "../../domain/repositories/order.repository";
import { OrderResponseDto } from "../dto/order.dto";
import { OrderMessagingService } from "./order-messaging.service";

@Injectable()
export class OrderService {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepository,
    @Inject(CART_REPOSITORY)
    private readonly cartRepository: CartRepository,
    private readonly canteenView: CanteenViewRepository,
    private readonly orderMessaging: OrderMessagingService,
  ) {}

  async createFromCart(user: AuthenticatedUser): Promise<OrderResponseDto> {
    const cartItems = await this.cartRepository.getItems(user.sub);
    if (cartItems.length === 0) {
      throw new ConflictException("Carrinho vazio");
    }

    const canteenId = cartItems[0].canteenId;
    const canteen = await this.canteenView.findById(canteenId);
    if (!canteen || !canteen.isOpen) {
      throw new ConflictException("Cantina fechada no momento");
    }

    const items = cartItems.map((ci) => {
      const extrasTotal = ci.extras.reduce(
        (sum, e) => sum + parseFloat(e.price),
        0,
      );
      return {
        productId: ci.productId,
        productNameSnapshot: ci.productName,
        unitPriceAtPurchase: ci.productPrice,
        quantity: ci.quantity,
        note: ci.note,
        extras: ci.extras.map((e) => ({
          extraId: e.id,
          extraNameSnapshot: e.name,
          unitPriceAtPurchase: e.price,
        })),
        lineTotal: (parseFloat(ci.productPrice) + extrasTotal) * ci.quantity,
      };
    });

    const total = items.reduce((sum, i) => sum + i.lineTotal, 0).toFixed(2);

    const order = await this.orderRepository.create({
      userId: user.sub,
      customerEmail: user.email,
      customerName: user.name,
      canteenId,
      total,
      items: items.map(({ lineTotal, ...rest }) => rest),
    });

    await this.cartRepository.clear(user.sub);

    await this.orderMessaging.publishOrderCreated({
      orderId: order.id,
      customerId: order.userId,
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      canteenId: order.canteenId,
      canteenName: canteen.name,
      total: String(order.total),
    });

    return OrderResponseDto.from(order);
  }

  async findById(id: string): Promise<OrderResponseDto> {
    const order = await this.orderRepository.findById(id);
    if (!order) throw new NotFoundException("Pedido não encontrado");
    return OrderResponseDto.from(order);
  }

  async advance(id: string, user: AuthenticatedUser): Promise<OrderResponseDto> {
    const order = await this.orderRepository.findById(id);
    if (!order) throw new NotFoundException("Pedido não encontrado");

    if (user.role === UserRole.SELLER && user.canteenId !== order.canteenId) {
      throw new ForbiddenException("Pedido não pertence à sua cantina");
    }

    const next = getNextStatus(order.status);
    if (!next) {
      throw new ConflictException(
        `Não é possível avançar pedido no status ${order.status}`,
      );
    }

    await this.orderRepository.updateStatus(id, next);
    const updated = await this.orderRepository.findById(id);
    await this.notifyStatusChanged(updated!);
    return OrderResponseDto.from(updated!);
  }

  async pickup(id: string, user: AuthenticatedUser): Promise<OrderResponseDto> {
    const order = await this.orderRepository.findById(id);
    if (!order) throw new NotFoundException("Pedido não encontrado");
    if (order.userId !== user.sub) {
      throw new ForbiddenException("Este pedido não é seu");
    }
    if (order.status !== OrderStatus.AGUARDANDO_RETIRADA) {
      throw new ConflictException("Pedido não está aguardando retirada");
    }

    await this.orderRepository.updateStatus(id, OrderStatus.RETIRADO);
    const updated = await this.orderRepository.findById(id);
    await this.notifyStatusChanged(updated!);
    return OrderResponseDto.from(updated!);
  }

  async cancel(
    id: string,
    user: AuthenticatedUser,
    reason?: string,
  ): Promise<OrderResponseDto> {
    const order = await this.orderRepository.findById(id);
    if (!order) throw new NotFoundException("Pedido não encontrado");

    if (
      user.role === UserRole.CUSTOMER &&
      (order.userId !== user.sub || order.status !== OrderStatus.AGUARDANDO)
    ) {
      throw new ForbiddenException(
        "Clientes só podem cancelar pedidos em AGUARDANDO",
      );
    }

    if (user.role === UserRole.SELLER && user.canteenId !== order.canteenId) {
      throw new ForbiddenException("Pedido não pertence à sua cantina");
    }

    if (!canCancel(order.status)) {
      throw new ConflictException(
        `Não é possível cancelar pedido no status ${order.status}`,
      );
    }

    await this.orderRepository.updateStatus(id, OrderStatus.CANCELADO, reason);
    const updated = await this.orderRepository.findById(id);
    await this.notifyStatusChanged(updated!);
    return OrderResponseDto.from(updated!);
  }

  async rate(
    id: string,
    user: AuthenticatedUser,
    rating: number,
    comment?: string,
  ): Promise<void> {
    const order = await this.orderRepository.findById(id);
    if (!order) throw new NotFoundException("Pedido não encontrado");
    if (order.userId !== user.sub) {
      throw new ForbiddenException("Este pedido não é seu");
    }
    if (order.status !== OrderStatus.RETIRADO) {
      throw new ConflictException("Só é possível avaliar pedidos retirados");
    }
    if (order.rating !== null) {
      throw new ConflictException("Pedido já foi avaliado");
    }

    await this.orderRepository.setRating(id, rating, comment);
  }

  async findByUser(
    userId: string,
    status: string,
    page: number,
    perPage: number,
  ): Promise<PaginatedResult<OrderResponseDto>> {
    const terminal = status === "history";
    const result = await this.orderRepository.findByUser(
      userId,
      terminal,
      page,
      perPage,
    );
    return result.map(OrderResponseDto.from);
  }

  async findByCanteen(
    canteenId: string,
    statusFilter: string,
    page: number,
    perPage: number,
  ): Promise<PaginatedResult<OrderResponseDto>> {
    const statuses = statusFilter
      ? (statusFilter.split(",") as OrderStatus[])
      : [];
    const result = await this.orderRepository.findByCanteen(
      canteenId,
      statuses,
      page,
      perPage,
    );
    return result.map(OrderResponseDto.from);
  }

  private async notifyStatusChanged(order: OrderRow): Promise<void> {
    await this.orderMessaging.publishOrderStatusChanged({
      orderId: order.id,
      customerId: order.userId,
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      status: order.status,
    });
  }
}
