import { Module } from "@nestjs/common";
import { SharedModule } from "@shared/shared.module";
import { USER_REPOSITORY } from "./domain/repositories/user.repository";
import { DrizzleUserRepository } from "./infra/repositories/drizzle-user.repository";

@Module({
  imports: [SharedModule],
  providers: [DrizzleUserRepository, { provide: USER_REPOSITORY, useExisting: DrizzleUserRepository }],
  exports: [USER_REPOSITORY],
})
export class UsersModule {}

