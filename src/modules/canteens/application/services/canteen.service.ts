import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import bcrypt from "bcryptjs";
import { PaginatedResult } from "@shared/application/dto/paginated-result";
import { UserRole } from "@shared/domain/enums/user-role.enum";
import { MinioService } from "@shared/infra/storage/minio.service";
import {
  USER_REPOSITORY,
  UserRepository,
} from "../../../users/domain/repositories/user.repository";
import { User } from "../../../users/domain/models/user";
import {
  CANTEEN_REPOSITORY,
  CanteenRepository,
} from "../../domain/repositories/canteen.repository";
import { CreateCanteenDto } from "../dto/create-canteen.dto";
import { UpdateCanteenDto } from "../dto/update-canteen.dto";
import { CanteenResponseDto } from "../dto/canteen-response.dto";
import { randomUUID } from "crypto";

@Injectable()
export class CanteenService {
  constructor(
    @Inject(CANTEEN_REPOSITORY)
    private readonly canteenRepository: CanteenRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    private readonly minioService: MinioService,
  ) {}

  async create(
    dto: CreateCanteenDto,
    currentUser: User,
  ): Promise<CanteenResponseDto> {
    if (
      currentUser.role === UserRole.INSTITUTION_ADMIN &&
      currentUser.institutionId !== dto.institutionId
    ) {
      throw new ForbiddenException(
        "Você só pode criar cantinas na sua própria instituição",
      );
    }

    const existingSeller = await this.userRepository.findByEmail(dto.sellerEmail);
    if (existingSeller) {
      throw new ConflictException("Já existe um usuário com esse email");
    }

    const canteen = await this.canteenRepository.create({
      institutionId: dto.institutionId,
      name: dto.name,
      cnpj: dto.cnpj ?? null,
      block: dto.block ?? null,
      room: dto.room ?? null,
    });

    const passwordHash = await bcrypt.hash(dto.sellerPassword, 10);
    await this.userRepository.create({
      fullName: dto.sellerName,
      email: dto.sellerEmail,
      passwordHash,
      role: UserRole.SELLER,
      institutionId: dto.institutionId,
      canteenId: canteen.id,
    });

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
    currentUser: User,
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

    return CanteenResponseDto.from(updated);
  }

  async remove(id: string, currentUser: User): Promise<void> {
    const canteen = await this.canteenRepository.findById(id);
    if (!canteen) {
      throw new NotFoundException("Cantina não encontrada");
    }

    this.assertCanManage(currentUser, canteen.institutionId, canteen.id);

    await this.canteenRepository.delete(id);
  }

  async toggleOpen(id: string, currentUser: User): Promise<CanteenResponseDto> {
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

    return CanteenResponseDto.from(updated);
  }

  async count(institutionId?: string): Promise<{ total: number }> {
    const total = await this.canteenRepository.count(institutionId);
    return { total };
  }

  async uploadLogo(
    id: string,
    file: Express.Multer.File,
    currentUser: User,
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

  private assertCanManage(
    user: User,
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
