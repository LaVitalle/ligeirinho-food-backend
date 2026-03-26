import { UserRole } from "@shared/domain/enums/user-role.enum";
import { User } from "../models/user";

export const USER_REPOSITORY = Symbol("USER_REPOSITORY");

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
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
}
