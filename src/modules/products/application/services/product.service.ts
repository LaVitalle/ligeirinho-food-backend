import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "crypto";
import { PaginatedResult } from "@shared/application/dto/paginated-result";
import { UserRole } from "@shared/domain/enums/user-role.enum";
import { MinioService } from "@shared/infra/storage/minio.service";
import { User } from "../../../users/domain/models/user";
import {
  PRODUCT_REPOSITORY,
  ProductRepository,
} from "../../domain/repositories/product.repository";
import {
  CreateProductDto,
  ProductResponseDto,
  UpdateProductDto,
} from "../dto/product.dto";

@Injectable()
export class ProductService {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    private readonly minioService: MinioService,
  ) {}

  async create(
    dto: CreateProductDto,
    currentUser: User,
  ): Promise<ProductResponseDto> {
    this.assertSellerOwnsCanteen(currentUser, dto.canteenId);

    const product = await this.productRepository.create({
      canteenId: dto.canteenId,
      categoryId: dto.categoryId,
      name: dto.name,
      description: dto.description ?? null,
      price: dto.price,
    });
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
    currentUser: User,
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
    return ProductResponseDto.from(updated);
  }

  async remove(id: string, currentUser: User): Promise<void> {
    const product = await this.productRepository.findById(id);
    if (!product) throw new NotFoundException("Produto não encontrado");
    this.assertSellerOwnsCanteen(currentUser, product.canteenId);
    await this.productRepository.delete(id);
  }

  async uploadPhoto(
    id: string,
    file: Express.Multer.File,
    currentUser: User,
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

  async feature(id: string, currentUser: User): Promise<ProductResponseDto> {
    const product = await this.productRepository.findById(id);
    if (!product) throw new NotFoundException("Produto não encontrado");
    this.assertSellerOwnsCanteen(currentUser, product.canteenId);
    const updated = await this.productRepository.update(id, { isFeatured: true });
    return ProductResponseDto.from(updated);
  }

  async unfeature(id: string, currentUser: User): Promise<ProductResponseDto> {
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

  private assertSellerOwnsCanteen(user: User, canteenId: string): void {
    if (user.role === UserRole.ADMIN) return;
    if (user.role === UserRole.SELLER && user.canteenId === canteenId) return;
    throw new ForbiddenException("Sem permissão para gerenciar este produto");
  }
}
