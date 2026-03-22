import { ApiProperty } from "@nestjs/swagger";
import { UserRole } from "@shared/domain/enums/user-role.enum";
import { User } from "../../domain/models/user";

export class UserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ required: false, nullable: true })
  phoneNumber: string | null;

  @ApiProperty({ required: false, nullable: true })
  profilePhotoUrl: string | null;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty({ required: false, nullable: true })
  institutionId: string | null;

  @ApiProperty({ required: false, nullable: true })
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

