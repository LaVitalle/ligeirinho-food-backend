import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { UserRole } from "@shared/domain/enums/user-role.enum";
import { User } from "../../domain/models/user";

export class UserDto {
  @ApiProperty({
    description: "Identificador único do usuário (UUID v4)",
    example: "a3f2c1d0-8b4e-4f7a-9c6d-1e5f2a3b4c5d",
  })
  id: string;

  @ApiProperty({
    description: "Nome completo do usuário",
    example: "Maria da Silva",
  })
  fullName: string;

  @ApiProperty({
    description: "Endereço de e-mail do usuário",
    example: "maria.silva@exemplo.com",
  })
  email: string;

  @ApiPropertyOptional({
    description: "Número de telefone celular com DDD e código do país",
    example: "+55 11 99999-9999",
    nullable: true,
  })
  phoneNumber: string | null;

  @ApiPropertyOptional({
    description: "URL pública da foto de perfil armazenada no MinIO",
    example: "https://storage.exemplo.com/avatars/a3f2c1d0.jpg",
    nullable: true,
  })
  profilePhotoUrl: string | null;

  @ApiProperty({
    description: "Papel do usuário no sistema",
    enum: UserRole,
    example: UserRole.CUSTOMER,
  })
  role: UserRole;

  @ApiPropertyOptional({
    description:
      "ID da instituição à qual o usuário pertence. Preenchido para CUSTOMER e INSTITUTION_ADMIN; nulo para ADMIN",
    example: "b7e1d2f3-4a5c-6d7e-8f9a-0b1c2d3e4f5a",
    nullable: true,
  })
  institutionId: string | null;

  @ApiPropertyOptional({
    description:
      "ID da cantina à qual o usuário pertence. Preenchido apenas para SELLER; nulo para os demais papéis",
    example: "c4d5e6f7-8a9b-0c1d-2e3f-4a5b6c7d8e9f",
    nullable: true,
  })
  canteenId: string | null;

  static from(user: User | null): UserDto | null {
    if (!user) return null;
    const dto = new UserDto();
    dto.id = user.id;
    dto.fullName = user.fullName;
    dto.email = user.email;
    dto.phoneNumber = user.phoneNumber;
    dto.profilePhotoUrl = user.profilePhotoUrl;
    dto.role = user.role;
    dto.institutionId = user.institutionId;
    dto.canteenId = user.canteenId;
    return dto;
  }
}

