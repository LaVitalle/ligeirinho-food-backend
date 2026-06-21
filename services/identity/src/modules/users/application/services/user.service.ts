import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import bcrypt from "bcryptjs";
import { PaginatedResult } from "@shared/application/dto/paginated-result";
import { UserRole } from "@shared/domain/enums/user-role.enum";
import {
  USER_REPOSITORY,
  UserRepository,
} from "../../domain/repositories/user.repository";
import {
  INSTITUTION_REPOSITORY,
  InstitutionRepository,
} from "../../../institutions/domain/repositories/institution.repository";
import { User } from "../../domain/models/user";
import { UserDto } from "../dto/user.dto";
import {
  ChangeRoleDto,
  CreateUserDto,
  MigrateInstitutionDto,
  UpdateUserDto,
} from "../dto/user-admin.dto";

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(INSTITUTION_REPOSITORY)
    private readonly institutionRepository: InstitutionRepository,
  ) {}

  async findById(id: string): Promise<UserDto> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException("Usuário não encontrado");
    return UserDto.from(user)!;
  }

  // BE-54: GET /me
  async getMe(user: User): Promise<UserDto> {
    return UserDto.from(user)!;
  }

  // BE-54: PATCH /me
  async updateMe(user: User, dto: UpdateUserDto): Promise<UserDto> {
    const updated = await this.userRepository.update(user.id, {
      fullName: dto.fullName,
      phoneNumber: dto.phoneNumber,
      profilePhotoUrl: dto.profilePhotoUrl,
    });
    return UserDto.from(updated)!;
  }

  // BE-54: DELETE /me
  async deleteMe(user: User): Promise<void> {
    if (user.role === UserRole.SELLER) {
      throw new ForbiddenException(
        "SELLER não pode desativar a própria conta. Use DELETE /canteens/:id.",
      );
    }
    if (user.role === UserRole.ADMIN) {
      throw new ForbiddenException(
        "ADMIN não pode desativar a própria conta.",
      );
    }
    await this.userRepository.update(user.id, { deletedAt: new Date() });
  }

  // BE-55: POST /me/migrate-institution
  async migrateInstitution(
    user: User,
    dto: MigrateInstitutionDto,
  ): Promise<UserDto> {
    if (user.role !== UserRole.CUSTOMER) {
      throw new ForbiddenException("Apenas CUSTOMER pode migrar de instituição");
    }
    const institution = await this.institutionRepository.findByAccessCode(
      dto.accessCode,
    );
    if (!institution) {
      throw new NotFoundException("Código de acesso inválido");
    }
    // O carrinho vive no orders-service; a limpeza ao migrar é tratada lá.
    const updated = await this.userRepository.update(user.id, {
      institutionId: institution.id,
    });
    return UserDto.from(updated)!;
  }

  // BE-56: GET /users
  async findAll(
    page: number,
    perPage: number,
    currentUser: User,
    search?: string,
    role?: string,
    institutionId?: string,
    onlyActive = true,
  ): Promise<PaginatedResult<UserDto>> {
    const filters: {
      search?: string;
      role?: UserRole;
      institutionId?: string;
      onlyActive?: boolean;
    } = { search, onlyActive };

    if (role) filters.role = role as UserRole;

    if (currentUser.role === UserRole.INSTITUTION_ADMIN) {
      filters.institutionId = currentUser.institutionId!;
    } else if (institutionId) {
      filters.institutionId = institutionId;
    }

    const result = await this.userRepository.findAll(page, perPage, filters);
    return result.map((u) => UserDto.from(u)!);
  }

  // BE-57: POST /users
  async createAdmin(dto: CreateUserDto): Promise<UserDto> {
    if (
      dto.role !== UserRole.ADMIN &&
      dto.role !== UserRole.INSTITUTION_ADMIN
    ) {
      throw new BadRequestException(
        "Este endpoint cria apenas ADMIN ou INSTITUTION_ADMIN",
      );
    }
    if (dto.role === UserRole.INSTITUTION_ADMIN && !dto.institutionId) {
      throw new BadRequestException(
        "institutionId é obrigatório para INSTITUTION_ADMIN",
      );
    }

    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException("Email já está em uso");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.userRepository.create({
      fullName: dto.fullName,
      email: dto.email,
      passwordHash,
      role: dto.role,
      institutionId:
        dto.role === UserRole.INSTITUTION_ADMIN
          ? dto.institutionId!
          : null,
    });
    return UserDto.from(user)!;
  }

  // BE-58: PATCH /users/:id
  async updateUser(
    id: string,
    dto: UpdateUserDto,
    currentUser: User,
  ): Promise<UserDto> {
    const target = await this.userRepository.findById(id);
    if (!target) throw new NotFoundException("Usuário não encontrado");
    this.assertCanManageUser(currentUser, target);

    const updated = await this.userRepository.update(id, {
      fullName: dto.fullName,
      phoneNumber: dto.phoneNumber,
      profilePhotoUrl: dto.profilePhotoUrl,
    });
    return UserDto.from(updated)!;
  }

  // BE-59: PATCH /users/:id/role
  async changeRole(
    id: string,
    dto: ChangeRoleDto,
  ): Promise<UserDto> {
    const target = await this.userRepository.findById(id);
    if (!target) throw new NotFoundException("Usuário não encontrado");

    if (dto.role === UserRole.SELLER) {
      throw new BadRequestException("SELLER é criado via cantina, não por aqui");
    }

    const updated = await this.userRepository.update(id, {
      role: dto.role,
      institutionId:
        dto.role === UserRole.ADMIN ? null : target.institutionId,
      canteenId:
        dto.role === UserRole.ADMIN || dto.role === UserRole.INSTITUTION_ADMIN
          ? null
          : target.canteenId,
    });
    return UserDto.from(updated)!;
  }

  // BE-60: DELETE /users/:id
  async softDeleteUser(id: string, currentUser: User): Promise<void> {
    const target = await this.userRepository.findById(id);
    if (!target) throw new NotFoundException("Usuário não encontrado");

    if (id === currentUser.id) {
      throw new ForbiddenException("Use DELETE /me para desativar a própria conta");
    }

    this.assertCanManageUser(currentUser, target);

    await this.userRepository.update(id, { deletedAt: new Date() });
  }

  // BE-61: POST /users/:id/force-reset-password
  // (just generates recovery — reuses password recovery service, called from controller)

  private assertCanManageUser(currentUser: User, target: User): void {
    if (currentUser.role === UserRole.ADMIN) return;
    if (
      currentUser.role === UserRole.INSTITUTION_ADMIN &&
      currentUser.institutionId === target.institutionId
    ) {
      return;
    }
    throw new ForbiddenException("Sem permissão para gerenciar este usuário");
  }
}
