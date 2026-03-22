import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from "class-validator";
import { UserRole } from "@shared/domain/enums/user-role.enum";

export class RegisterDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  fullName: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  institutionId?: string;

  @ApiProperty({ required: false })
  @ValidateIf((o) => o.role === UserRole.SELLER)
  @IsString()
  canteenId?: string;
}

