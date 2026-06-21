import { Module, forwardRef } from "@nestjs/common";
import { InstitutionsModule } from "../institutions/institutions.module";
import { AuthModule } from "../auth/auth.module";
import { USER_REPOSITORY } from "./domain/repositories/user.repository";
import { DrizzleUserRepository } from "./infra/repositories/drizzle-user.repository";
import { UserService } from "./application/services/user.service";
import { MeController } from "./infra/controllers/me.controller";
import { UserController } from "./infra/controllers/user.controller";

@Module({
  imports: [
    forwardRef(() => InstitutionsModule),
    forwardRef(() => AuthModule),
  ],
  controllers: [MeController, UserController],
  providers: [
    UserService,
    DrizzleUserRepository,
    { provide: USER_REPOSITORY, useExisting: DrizzleUserRepository },
  ],
  exports: [USER_REPOSITORY, UserService],
})
export class UsersModule {}
