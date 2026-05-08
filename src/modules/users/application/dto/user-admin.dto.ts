import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";
import { UserRole } from "@shared/domain/enums/user-role.enum";

export class CreateUserDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(100) fullName: string;
  @ApiProperty() @IsEmail() email: string;
  @ApiProperty() @IsString() @MinLength(6) password: string;
  @ApiProperty({ enum: [UserRole.ADMIN, UserRole.INSTITUTION_ADMIN] })
  @IsEnum([UserRole.ADMIN, UserRole.INSTITUTION_ADMIN])
  role: UserRole;
  @ApiPropertyOptional() @IsOptional() @IsUUID() institutionId?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) fullName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20) phoneNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() profilePhotoUrl?: string;
}

export class ChangeRoleDto {
  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;
}

export class MigrateInstitutionDto {
  @ApiProperty({ example: "123456" })
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  accessCode: string;
}
