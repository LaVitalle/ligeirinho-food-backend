import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { UserRole } from "@shared/domain/enums/user-role.enum";
import { CurrentUser } from "@shared/infra/decorators/current-user.decorator";
import { ResponseMessage } from "@shared/infra/decorators/response-message.decorator";
import { Roles } from "@shared/infra/decorators/roles.decorator";
import { ApiWrappedResponse } from "@shared/infra/swagger/api-response.dto";
import { User } from "../../domain/models/user";
import { UserDto } from "../../application/dto/user.dto";
import {
  ChangeRoleDto,
  CreateUserDto,
  UpdateUserDto,
} from "../../application/dto/user-admin.dto";
import { UserService } from "../../application/services/user.service";
import { PasswordRecoveryService } from "../../../auth/application/services/password-recovery.service";

@ApiTags("Users")
@ApiBearerAuth()
@Controller("users")
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly passwordRecoveryService: PasswordRecoveryService,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({ summary: "Lista usuários com escopo" })
  @ResponseMessage("Usuários listados")
  @ApiWrappedResponse(UserDto, { isArray: true, description: "Usuários" })
  async findAll(
    @CurrentUser() user: User,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("perPage", new DefaultValuePipe(10), ParseIntPipe) perPage: number,
    @Query("search") search?: string,
    @Query("role") role?: string,
    @Query("institutionId") institutionId?: string,
    @Query("onlyActive", new DefaultValuePipe(true), ParseBoolPipe) onlyActive?: boolean,
  ) {
    return this.userService.findAll(
      page,
      perPage,
      user,
      search,
      role,
      institutionId,
      onlyActive,
    );
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Cria ADMIN ou INSTITUTION_ADMIN" })
  @ResponseMessage("Usuário criado com sucesso")
  @ApiWrappedResponse(UserDto, { description: "Usuário criado" })
  async create(@Body() dto: CreateUserDto) {
    return this.userService.createAdmin(dto);
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({ summary: "Edita dados do usuário" })
  @ResponseMessage("Usuário atualizado")
  @ApiWrappedResponse(UserDto, { description: "Usuário atualizado" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: User,
  ) {
    return this.userService.updateUser(id, dto, user);
  }

  @Patch(":id/role")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Muda role do usuário" })
  @ResponseMessage("Role atualizado")
  @ApiWrappedResponse(UserDto, { description: "Usuário com novo role" })
  async changeRole(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ChangeRoleDto,
  ) {
    return this.userService.changeRole(id, dto);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({ summary: "Soft delete do usuário" })
  @ResponseMessage("Usuário desativado")
  async remove(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    await this.userService.softDeleteUser(id, user);
    return null;
  }

  @Post(":id/force-reset-password")
  @Roles(UserRole.ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({ summary: "Envia código de reset de senha por email" })
  @ResponseMessage("Código de recuperação enviado")
  async forceResetPassword(@Param("id", ParseUUIDPipe) id: string) {
    const target = await this.userService.findById(id);
    return this.passwordRecoveryService.requestRecovery(target.email);
  }
}
