import { Injectable } from "@nestjs/common";
import { DrizzleService } from "@shared/infra/database/drizzle.service";
import { UserRole } from "@shared/domain/enums/user-role.enum";
import { User } from "../../domain/models/user";
import { UserRepository } from "../../domain/repositories/user.repository";
import { usersSchema } from "../schemas/user.schema";
import { eq } from "drizzle-orm";

@Injectable()
export class DrizzleUserRepository implements UserRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findById(id: string): Promise<User | null> {
    const rows = await this.drizzle.db
      .select()
      .from(usersSchema)
      .where(eq(usersSchema.id, id))
      .limit(1);
    const row = rows[0];
    return User.restore(
      row && {
        id: row.id,
        fullName: row.fullName,
        email: row.email,
        passwordHash: row.passwordHash,
        phoneNumber: row.phoneNumber ?? null,
        profilePhotoUrl: row.profilePhotoUrl ?? null,
        role: row.role as UserRole,
        institutionId: row.institutionId ?? null,
        canteenId: row.canteenId ?? null,
        createdAt: row.createdAt as unknown as Date,
        updatedAt: row.updatedAt as unknown as Date,
      },
    );
  }

  async findByEmail(email: string): Promise<User | null> {
    const rows = await this.drizzle.db
      .select()
      .from(usersSchema)
      .where(eq(usersSchema.email, email))
      .limit(1);
    const row = rows[0];
    return User.restore(
      row && {
        id: row.id,
        fullName: row.fullName,
        email: row.email,
        passwordHash: row.passwordHash,
        phoneNumber: row.phoneNumber ?? null,
        profilePhotoUrl: row.profilePhotoUrl ?? null,
        role: row.role as UserRole,
        institutionId: row.institutionId ?? null,
        canteenId: row.canteenId ?? null,
        createdAt: row.createdAt as unknown as Date,
        updatedAt: row.updatedAt as unknown as Date,
      },
    );
  }

  async create(data: {
    fullName: string;
    email: string;
    passwordHash: string;
    phoneNumber?: string | null;
    profilePhotoUrl?: string | null;
    role: UserRole;
    institutionId?: string | null;
    canteenId?: string | null;
  }): Promise<User> {
    const [row] = await this.drizzle.db
      .insert(usersSchema)
      .values({
        fullName: data.fullName,
        email: data.email,
        passwordHash: data.passwordHash,
        phoneNumber: data.phoneNumber ?? null,
        profilePhotoUrl: data.profilePhotoUrl ?? null,
        role: data.role,
        institutionId: data.institutionId ?? null,
        canteenId: data.canteenId ?? null,
      })
      .returning();

    return User.restore({
      id: row.id,
      fullName: row.fullName,
      email: row.email,
      passwordHash: row.passwordHash,
      phoneNumber: row.phoneNumber ?? null,
      profilePhotoUrl: row.profilePhotoUrl ?? null,
      role: row.role as UserRole,
      institutionId: row.institutionId ?? null,
      canteenId: row.canteenId ?? null,
      createdAt: row.createdAt as unknown as Date,
      updatedAt: row.updatedAt as unknown as Date,
    })!;
  }
}
