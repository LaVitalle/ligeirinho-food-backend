import { PaginatedResult } from "@shared/application/dto/paginated-result";
import { UserRole } from "@shared/domain/enums/user-role.enum";
import { User } from "../models/user";

export const USER_REPOSITORY = Symbol("USER_REPOSITORY");

export interface UserListFilters {
  search?: string;
  role?: UserRole;
  institutionId?: string;
  onlyActive?: boolean;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByEmailIncludeDeleted(email: string): Promise<User | null>;
  create(data: {
    fullName: string;
    email: string;
    passwordHash: string;
    phoneNumber?: string | null;
    profilePhotoUrl?: string | null;
    role: UserRole;
    institutionId?: string | null;
    canteenId?: string | null;
  }): Promise<User>;
  update(
    id: string,
    data: Partial<{
      fullName: string;
      passwordHash: string;
      phoneNumber: string | null;
      profilePhotoUrl: string | null;
      deletedAt: Date | null;
      role: UserRole;
      institutionId: string | null;
      canteenId: string | null;
    }>,
  ): Promise<User>;
  findAll(
    page: number,
    perPage: number,
    filters?: UserListFilters,
  ): Promise<PaginatedResult<User>>;
}
