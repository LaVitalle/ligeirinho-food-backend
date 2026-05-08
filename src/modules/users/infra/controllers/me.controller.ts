import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "@shared/infra/decorators/current-user.decorator";
import { ResponseMessage } from "@shared/infra/decorators/response-message.decorator";
import { ApiWrappedResponse } from "@shared/infra/swagger/api-response.dto";
import { User } from "../../domain/models/user";
import { UserDto } from "../../application/dto/user.dto";
import { UpdateUserDto, MigrateInstitutionDto } from "../../application/dto/user-admin.dto";
import { UserService } from "../../application/services/user.service";

@ApiTags("Me")
@ApiBearerAuth()
@Controller("me")
export class MeController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: "Retorna perfil do usuário logado" })
  @ResponseMessage("Perfil carregado")
  @ApiWrappedResponse(UserDto, { description: "Perfil do usuário" })
  async getMe(@CurrentUser() user: User) {
    return this.userService.getMe(user);
  }

  @Patch()
  @ApiOperation({ summary: "Edita perfil do usuário logado" })
  @ResponseMessage("Perfil atualizado")
  @ApiWrappedResponse(UserDto, { description: "Perfil atualizado" })
  async updateMe(@Body() dto: UpdateUserDto, @CurrentUser() user: User) {
    return this.userService.updateMe(user, dto);
  }

  @Delete()
  @ApiOperation({ summary: "Soft delete da própria conta" })
  @ResponseMessage("Conta desativada")
  async deleteMe(@CurrentUser() user: User) {
    await this.userService.deleteMe(user);
    return null;
  }

  @Post("migrate-institution")
  @ApiOperation({ summary: "CUSTOMER migra de instituição" })
  @ResponseMessage("Instituição alterada com sucesso")
  @ApiWrappedResponse(UserDto, { description: "Usuário com nova instituição" })
  async migrateInstitution(
    @Body() dto: MigrateInstitutionDto,
    @CurrentUser() user: User,
  ) {
    return this.userService.migrateInstitution(user, dto);
  }
}
