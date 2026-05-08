import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PaginatedResult } from "@shared/application/dto/paginated-result";
import { UserRole } from "@shared/domain/enums/user-role.enum";
import { User } from "../../../users/domain/models/user";
import {
  CART_REPOSITORY,
  CartRepository,
} from "../../../cart/domain/repositories/cart.repository";
import {
  CANTEEN_REPOSITORY,
  CanteenRepository,
} from "../../../canteens/domain/repositories/canteen.repository";
import {
  OrderStatus,
  canCancel,
  getNextStatus,
  isTerminal,
} from "../../domain/models/order-status";
import {
  ORDER_REPOSITORY,
  OrderRepository,
} from "../../domain/repositories/order.repository";
import { OrderResponseDto } from "../dto/order.dto";

@Injectable()
export class OrderService {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepository,
    @Inject(CART_REPOSITORY)
    private readonly cartRepository: CartRepository,
    @Inject(CANTEEN_REPOSITORY)
    private readonly canteenRepository: CanteenRepository,
  ) {}

  async createFromCart(user: User): Promise<OrderResponseDto> {
    const cartItems = await this.cartRepository.getItems(user.id);
    if (cartItems.length === 0) {
      throw new ConflictException("Carrinho vazio");
    }

    const canteenId = cartItems[0].canteenId;
    const canteen = await this.canteenRepository.findById(canteenId);
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
        lineTotal:
          (parseFloat(ci.productPrice) + extrasTotal) * ci.quantity,
      };
    });

    const total = items.reduce((sum, i) => sum + i.lineTotal, 0).toFixed(2);

    const order = await this.orderRepository.create({
      userId: user.id,
      canteenId,
      total,
      items: items.map(({ lineTotal, ...rest }) => rest),
    });

    await this.cartRepository.clear(user.id);

    return OrderResponseDto.from(order);
  }

  async findById(id: string): Promise<OrderResponseDto> {
    const order = await this.orderRepository.findById(id);
    if (!order) throw new NotFoundException("Pedido não encontrado");
    return OrderResponseDto.from(order);
  }

  async advance(id: string, user: User): Promise<OrderResponseDto> {
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
    return OrderResponseDto.from(updated!);
  }

  async pickup(id: string, user: User): Promise<OrderResponseDto> {
    const order = await this.orderRepository.findById(id);
    if (!order) throw new NotFoundException("Pedido não encontrado");
    if (order.userId !== user.id) {
      throw new ForbiddenException("Este pedido não é seu");
    }
    if (order.status !== OrderStatus.AGUARDANDO_RETIRADA) {
      throw new ConflictException("Pedido não está aguardando retirada");
    }

    await this.orderRepository.updateStatus(id, OrderStatus.RETIRADO);
    const updated = await this.orderRepository.findById(id);
    return OrderResponseDto.from(updated!);
  }

  async cancel(
    id: string,
    user: User,
    reason?: string,
  ): Promise<OrderResponseDto> {
    const order = await this.orderRepository.findById(id);
    if (!order) throw new NotFoundException("Pedido não encontrado");

    if (
      user.role === UserRole.CUSTOMER &&
      (order.userId !== user.id || order.status !== OrderStatus.AGUARDANDO)
    ) {
      throw new ForbiddenException(
        "Clientes só podem cancelar pedidos em AGUARDANDO",
      );
    }

    if (
      user.role === UserRole.SELLER &&
      user.canteenId !== order.canteenId
    ) {
      throw new ForbiddenException("Pedido não pertence à sua cantina");
    }

    if (!canCancel(order.status)) {
      throw new ConflictException(
        `Não é possível cancelar pedido no status ${order.status}`,
      );
    }

    await this.orderRepository.updateStatus(id, OrderStatus.CANCELADO, reason);
    const updated = await this.orderRepository.findById(id);
    return OrderResponseDto.from(updated!);
  }

  async rate(
    id: string,
    user: User,
    rating: number,
    comment?: string,
  ): Promise<void> {
    const order = await this.orderRepository.findById(id);
    if (!order) throw new NotFoundException("Pedido não encontrado");
    if (order.userId !== user.id) {
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
}
