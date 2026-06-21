import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserRole } from "@shared/domain/enums/user-role.enum";
import {
  INSTITUTION_REPOSITORY,
  InstitutionRepository,
} from "../../../institutions/domain/repositories/institution.repository";
import {
  USER_REPOSITORY,
  UserRepository,
} from "../../../users/domain/repositories/user.repository";
import { User } from "../../../users/domain/models/user";
import { UserDto } from "../../../users/application/dto/user.dto";
import { RegisterDto } from "../dto/register.dto";
import { LoginDto } from "../dto/login.dto";
import bcrypt from "bcryptjs";

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(INSTITUTION_REPOSITORY)
    private readonly institutionRepository: InstitutionRepository,
    private readonly jwtService: JwtService,
  ) {}

  /** Claims do JWT — incluem institutionId/canteenId p/ os serviços stateless. */
  private buildPayload(user: User) {
    return {
      sub: user.id,
      email: user.email,
      name: user.fullName,
      role: user.role,
      institutionId: user.institutionId,
      canteenId: user.canteenId,
    };
  }

  async register(
    dto: RegisterDto,
  ): Promise<{ accessToken: string; user: UserDto }> {
    const institution = await this.institutionRepository.findByAccessCode(
      dto.accessCode,
    );
    if (!institution) {
      throw new NotFoundException("Código de acesso inválido");
    }

    const exists = await this.userRepository.findByEmail(dto.email);
    if (exists) {
      throw new ConflictException("Já existe um usuário com esse email");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.userRepository.create({
      fullName: dto.fullName,
      email: dto.email,
      passwordHash,
      phoneNumber: dto.phoneNumber ?? null,
      profilePhotoUrl: null,
      role: UserRole.CUSTOMER,
      institutionId: institution.id,
      canteenId: null,
    });

    const accessToken = await this.jwtService.signAsync(this.buildPayload(user));

    return { accessToken, user: UserDto.from(user)! };
  }

  async login(
    dto: LoginDto,
  ): Promise<{ accessToken: string; user: UserDto }> {
    const user = await this.userRepository.findByEmailIncludeDeleted(dto.email);
    if (!user) {
      throw new UnauthorizedException("Credenciais inválidas");
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("Credenciais inválidas");
    }

    if (user.deletedAt !== null) {
      throw new ForbiddenException({
        code: "ACCOUNT_DEACTIVATED",
        message:
          "Sua conta está desativada. Use a recuperação de senha ou solicite reativação.",
      });
    }

    const accessToken = await this.jwtService.signAsync(this.buildPayload(user));
    return { accessToken, user: UserDto.from(user)! };
  }
}
