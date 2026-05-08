import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PaginatedResult } from "@shared/application/dto/paginated-result";
import { UserRole } from "@shared/domain/enums/user-role.enum";
import { User } from "../../../users/domain/models/user";
import {
  EXTRA_REPOSITORY,
  ExtraRepository,
} from "../../domain/repositories/extra.repository";
import {
  CreateExtraDto,
  ExtraResponseDto,
  UpdateExtraDto,
} from "../dto/extra.dto";

@Injectable()
export class ExtraService {
  constructor(
    @Inject(EXTRA_REPOSITORY)
    private readonly extraRepository: ExtraRepository,
  ) {}

  async create(dto: CreateExtraDto, user: User): Promise<ExtraResponseDto> {
    this.assertSeller(user, dto.canteenId);
    const extra = await this.extraRepository.create({
      canteenId: dto.canteenId,
      name: dto.name,
      price: dto.price,
    });
    return ExtraResponseDto.from(extra);
  }

  async findAll(
    page: number,
    perPage: number,
    canteenId: string,
  ): Promise<PaginatedResult<ExtraResponseDto>> {
    const result = await this.extraRepository.findAll(page, perPage, canteenId);
    return result.map(ExtraResponseDto.from);
  }

  async update(
    id: string,
    dto: UpdateExtraDto,
    user: User,
  ): Promise<ExtraResponseDto> {
    const extra = await this.extraRepository.findById(id);
    if (!extra) throw new NotFoundException("Adicional não encontrado");
    this.assertSeller(user, extra.canteenId);
    const updated = await this.extraRepository.update(id, {
      name: dto.name,
      price: dto.price,
      isActive: dto.isActive,
    });
    return ExtraResponseDto.from(updated);
  }

  async remove(id: string, user: User): Promise<void> {
    const extra = await this.extraRepository.findById(id);
    if (!extra) throw new NotFoundException("Adicional não encontrado");
    this.assertSeller(user, extra.canteenId);
    await this.extraRepository.delete(id);
  }

  async addToProduct(
    productId: string,
    extraIds: string[],
  ): Promise<void> {
    for (const extraId of extraIds) {
      await this.extraRepository.addToProduct(productId, extraId);
    }
  }

  async removeFromProduct(productId: string, extraId: string): Promise<void> {
    await this.extraRepository.removeFromProduct(productId, extraId);
  }

  async findByProduct(
    productId: string,
    onlyActive = false,
  ): Promise<ExtraResponseDto[]> {
    const extras = await this.extraRepository.findByProduct(productId, onlyActive);
    return extras.map(ExtraResponseDto.from);
  }

  async setRemovableIngredients(
    productId: string,
    names: string[],
  ): Promise<{ id: string; name: string }[]> {
    return this.extraRepository.setRemovableIngredients(productId, names);
  }

  async findRemovableIngredients(
    productId: string,
  ): Promise<{ id: string; name: string }[]> {
    return this.extraRepository.findRemovableIngredients(productId);
  }

  private assertSeller(user: User, canteenId: string): void {
    if (user.role === UserRole.ADMIN) return;
    if (user.role === UserRole.SELLER && user.canteenId === canteenId) return;
    throw new ForbiddenException("Sem permissão");
  }
}
