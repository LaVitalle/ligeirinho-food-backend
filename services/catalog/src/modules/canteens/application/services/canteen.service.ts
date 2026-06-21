import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PaginatedResult } from "@shared/application/dto/paginated-result";
import { UserRole } from "@shared/domain/enums/user-role.enum";
import { AuthenticatedUser } from "@shared/infra/auth/authenticated-user.interface";
import { MinioService } from "@shared/infra/storage/minio.service";
import {
  CANTEEN_REPOSITORY,
  CanteenRepository,
} from "../../domain/repositories/canteen.repository";
import { Canteen } from "../../domain/models/canteen";
import { CreateCanteenDto } from "../dto/create-canteen.dto";
import { UpdateCanteenDto } from "../dto/update-canteen.dto";
import { CanteenResponseDto } from "../dto/canteen-response.dto";
import { CanteenMessagingService } from "./canteen-messaging.service";
import { randomUUID } from "crypto";

@Injectable()
export class CanteenService {
  constructor(
    @Inject(CANTEEN_REPOSITORY)
    private readonly canteenRepository: CanteenRepository,
    private readonly canteenMessaging: CanteenMessagingService,
    private readonly minioService: MinioService,
  ) {}

  async create(
    dto: CreateCanteenDto,
    currentUser: AuthenticatedUser,
  ): Promise<CanteenResponseDto> {
    if (
      currentUser.role === UserRole.INSTITUTION_ADMIN &&
      currentUser.institutionId !== dto.institutionId
    ) {
      throw new ForbiddenException(
        "Você só pode criar cantinas na sua própria instituição",
      );
    }

    const canteen = await this.canteenRepository.create({
      institutionId: dto.institutionId,
      sellerId: null,
      name: dto.name,
      cnpj: dto.cnpj ?? null,
      block: dto.block ?? null,
      room: dto.room ?? null,
    });

    await this.canteenMessaging.publishCanteenCreated({
      canteenId: canteen.id,
      institutionId: dto.institutionId,
      canteenName: dto.name,
      sellerName: dto.sellerName,
      sellerEmail: dto.sellerEmail,
      sellerPassword: dto.sellerPassword,
    });

    await this.publishProjection(canteen);

    return CanteenResponseDto.from(canteen);
  }

  async findById(id: string): Promise<CanteenResponseDto> {
    const canteen = await this.canteenRepository.findById(id);
    if (!canteen) {
      throw new NotFoundException("Cantina não encontrada");
    }
    return CanteenResponseDto.from(canteen);
  }

  async findAll(
    page: number,
    perPage: number,
    filters?: { institutionId?: string; search?: string },
  ): Promise<PaginatedResult<CanteenResponseDto>> {
    const result = await this.canteenRepository.findAll(page, perPage, filters);
    return result.map((c) => CanteenResponseDto.from(c));
  }

  async update(
    id: string,
    dto: UpdateCanteenDto,
    currentUser: AuthenticatedUser,
  ): Promise<CanteenResponseDto> {
    const canteen = await this.canteenRepository.findById(id);
    if (!canteen) {
      throw new NotFoundException("Cantina não encontrada");
    }

    this.assertCanManage(currentUser, canteen.institutionId, canteen.id);

    const updated = await this.canteenRepository.update(id, {
      name: dto.name,
      cnpj: dto.cnpj,
      block: dto.block,
      room: dto.room,
    });

    await this.publishProjection(updated);

    return CanteenResponseDto.from(updated);
  }

  async remove(id: string, currentUser: AuthenticatedUser): Promise<void> {
    const canteen = await this.canteenRepository.findById(id);
    if (!canteen) {
      throw new NotFoundException("Cantina não encontrada");
    }

    this.assertCanManage(currentUser, canteen.institutionId, canteen.id);

    await this.canteenRepository.delete(id);
  }

  async toggleOpen(
    id: string,
    currentUser: AuthenticatedUser,
  ): Promise<CanteenResponseDto> {
    const canteen = await this.canteenRepository.findById(id);
    if (!canteen) {
      throw new NotFoundException("Cantina não encontrada");
    }

    if (
      currentUser.role === UserRole.SELLER &&
      currentUser.canteenId !== canteen.id
    ) {
      throw new ForbiddenException("Você só pode gerenciar a sua própria cantina");
    }

    const updated = await this.canteenRepository.update(id, {
      isOpen: !canteen.isOpen,
    });

    await this.publishProjection(updated);

    return CanteenResponseDto.from(updated);
  }

  async count(institutionId?: string): Promise<{ total: number }> {
    const total = await this.canteenRepository.count(institutionId);
    return { total };
  }

  async uploadLogo(
    id: string,
    file: Express.Multer.File,
    currentUser: AuthenticatedUser,
  ): Promise<CanteenResponseDto> {
    const canteen = await this.canteenRepository.findById(id);
    if (!canteen) {
      throw new NotFoundException("Cantina não encontrada");
    }

    this.assertCanManage(currentUser, canteen.institutionId, canteen.id);

    const ext = (file.originalname.split(".").pop() ?? "bin").toLowerCase();
    const key = `canteens/${randomUUID()}.${ext}`;
    const logoUrl = await this.minioService.upload(key, file.buffer, file.mimetype);

    const updated = await this.canteenRepository.update(id, { logoUrl });
    return CanteenResponseDto.from(updated);
  }

  private async publishProjection(canteen: Canteen): Promise<void> {
    await this.canteenMessaging.publishCanteenUpserted({
      canteenId: canteen.id,
      institutionId: canteen.institutionId,
      name: canteen.name,
      isOpen: canteen.isOpen,
    });
  }

  private assertCanManage(
    user: AuthenticatedUser,
    canteenInstitutionId: string,
    canteenId: string,
  ): void {
    if (user.role === UserRole.ADMIN) return;

    if (
      user.role === UserRole.INSTITUTION_ADMIN &&
      user.institutionId === canteenInstitutionId
    ) {
      return;
    }

    if (user.role === UserRole.SELLER && user.canteenId === canteenId) {
      return;
    }

    throw new ForbiddenException("Sem permissão para gerenciar esta cantina");
  }
}
