import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  PRODUCT_REPOSITORY,
  ProductRepository,
} from "../../../products/domain/repositories/product.repository";
import {
  CART_REPOSITORY,
  CartItem,
  CartRepository,
} from "../../domain/repositories/cart.repository";
import { AddCartItemDto, UpdateCartItemDto } from "../dto/cart.dto";

@Injectable()
export class CartService {
  constructor(
    @Inject(CART_REPOSITORY)
    private readonly cartRepository: CartRepository,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
  ) {}

  async addItem(userId: string, dto: AddCartItemDto): Promise<void> {
    const product = await this.productRepository.findById(dto.productId);
    if (!product) throw new NotFoundException("Produto não encontrado");

    const currentCanteenId = await this.cartRepository.getCanteenId(userId);
    if (currentCanteenId && currentCanteenId !== product.canteenId) {
      throw new ConflictException(
        "O carrinho só aceita itens de uma cantina por vez. Limpe o carrinho antes de adicionar itens de outra cantina.",
      );
    }

    await this.cartRepository.addItem({
      userId,
      productId: dto.productId,
      quantity: dto.quantity,
      note: dto.note,
      extraIds: dto.extraIds,
    });
  }

  async getItems(userId: string): Promise<CartItem[]> {
    return this.cartRepository.getItems(userId);
  }

  async updateItem(itemId: string, dto: UpdateCartItemDto): Promise<void> {
    await this.cartRepository.updateItemQuantity(itemId, dto.quantity);
  }

  async removeItem(itemId: string): Promise<void> {
    await this.cartRepository.removeItem(itemId);
  }

  async clear(userId: string): Promise<void> {
    await this.cartRepository.clear(userId);
  }
}
