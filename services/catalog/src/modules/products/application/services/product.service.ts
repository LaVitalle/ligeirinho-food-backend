import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "crypto";
import { PaginatedResult } from "@shared/application/dto/paginated-result";
import { UserRole } from "@shared/domain/enums/user-role.enum";
import { AuthenticatedUser } from "@shared/infra/auth/authenticated-user.interface";
import { MinioService } from "@shared/infra/storage/minio.service";
import {
  PRODUCT_REPOSITORY,
  ProductRepository,
} from "../../domain/repositories/product.repository";
import { Product } from "../../domain/models/product";
import {
  CreateProductDto,
  ProductResponseDto,
  UpdateProductDto,
} from "../dto/product.dto";
import { ProductMessagingService } from "./product-messaging.service";

@Injectable()
export class ProductService {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    private readonly productMessaging: ProductMessagingService,
    private readonly minioService: MinioService,
  ) {}

  async create(
    dto: CreateProductDto,
    currentUser: AuthenticatedUser,
  ): Promise<ProductResponseDto> {
    this.assertSellerOwnsCanteen(currentUser, dto.canteenId);

    const product = await this.productRepository.create({
      canteenId: dto.canteenId,
      categoryId: dto.categoryId,
      name: dto.name,
      description: dto.description ?? null,
      price: dto.price,
    });

    await this.publishUpserted(product);

    return ProductResponseDto.from(product);
  }

  async findById(id: string): Promise<ProductResponseDto> {
    const product = await this.productRepository.findById(id);
    if (!product) throw new NotFoundException("Produto não encontrado");
    return ProductResponseDto.from(product);
  }

  async findAll(
    page: number,
    perPage: number,
    canteenId: string,
    categoryId?: string,
    search?: string,
    onlyActive = true,
  ): Promise<PaginatedResult<ProductResponseDto>> {
    const result = await this.productRepository.findAll(page, perPage, {
      canteenId,
      categoryId,
      search,
      onlyActive,
    });
    return result.map(ProductResponseDto.from);
  }

  async update(
    id: string,
    dto: UpdateProductDto,
    currentUser: AuthenticatedUser,
  ): Promise<ProductResponseDto> {
    const product = await this.productRepository.findById(id);
    if (!product) throw new NotFoundException("Produto não encontrado");
    this.assertSellerOwnsCanteen(currentUser, product.canteenId);

    const updated = await this.productRepository.update(id, {
      categoryId: dto.categoryId,
      name: dto.name,
      description: dto.description,
      price: dto.price,
      isActive: dto.isActive,
    });

    await this.publishUpserted(updated);

    return ProductResponseDto.from(updated);
  }

  async remove(id: string, currentUser: AuthenticatedUser): Promise<void> {
    const product = await this.productRepository.findById(id);
    if (!product) throw new NotFoundException("Produto não encontrado");
    this.assertSellerOwnsCanteen(currentUser, product.canteenId);
    await this.productRepository.delete(id);

    await this.productMessaging.publishProductDeleted({
      productId: product.id,
      canteenId: product.canteenId,
      name: product.name,
      price: String(product.price),
      isAvailable: false,
    });
  }

  async uploadPhoto(
    id: string,
    file: Express.Multer.File,
    currentUser: AuthenticatedUser,
  ): Promise<ProductResponseDto> {
    const product = await this.productRepository.findById(id);
    if (!product) throw new NotFoundException("Produto não encontrado");
    this.assertSellerOwnsCanteen(currentUser, product.canteenId);

    const ext = (file.originalname.split(".").pop() ?? "bin").toLowerCase();
    const key = `products/${randomUUID()}.${ext}`;
    const photoUrl = await this.minioService.upload(key, file.buffer, file.mimetype);

    const updated = await this.productRepository.update(id, { photoUrl });
    return ProductResponseDto.from(updated);
  }

  async feature(
    id: string,
    currentUser: AuthenticatedUser,
  ): Promise<ProductResponseDto> {
    const product = await this.productRepository.findById(id);
    if (!product) throw new NotFoundException("Produto não encontrado");
    this.assertSellerOwnsCanteen(currentUser, product.canteenId);
    const updated = await this.productRepository.update(id, { isFeatured: true });
    return ProductResponseDto.from(updated);
  }

  async unfeature(
    id: string,
    currentUser: AuthenticatedUser,
  ): Promise<ProductResponseDto> {
    const product = await this.productRepository.findById(id);
    if (!product) throw new NotFoundException("Produto não encontrado");
    this.assertSellerOwnsCanteen(currentUser, product.canteenId);
    const updated = await this.productRepository.update(id, { isFeatured: false });
    return ProductResponseDto.from(updated);
  }

  async findFeatured(
    institutionId?: string,
    limit = 10,
  ): Promise<ProductResponseDto[]> {
    const products = await this.productRepository.findFeatured(
      institutionId,
      limit,
    );
    return products.map(ProductResponseDto.from);
  }

  private async publishUpserted(product: Product): Promise<void> {
    await this.productMessaging.publishProductUpserted({
      productId: product.id,
      canteenId: product.canteenId,
      name: product.name,
      price: String(product.price),
      isAvailable: product.isActive,
    });
  }

  private assertSellerOwnsCanteen(
    user: AuthenticatedUser,
    canteenId: string,
  ): void {
    if (user.role === UserRole.ADMIN) return;
    if (user.role === UserRole.SELLER && user.canteenId === canteenId) return;
    throw new ForbiddenException("Sem permissão para gerenciar este produto");
  }
}
