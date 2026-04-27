import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { UserRole } from "@shared/domain/enums/user-role.enum";
import { Public } from "@shared/infra/decorators/public.decorator";
import { ResponseMessage } from "@shared/infra/decorators/response-message.decorator";
import { Roles } from "@shared/infra/decorators/roles.decorator";
import { ApiWrappedResponse } from "@shared/infra/swagger/api-response.dto";
import { CreateInstitutionDto } from "../../application/dto/create-institution.dto";
import {
  InstitutionResponseDto,
  InstitutionValidateResponseDto,
} from "../../application/dto/institution-response.dto";
import { UpdateInstitutionDto } from "../../application/dto/update-institution.dto";
import { InstitutionService } from "../../application/services/institution.service";
import { AccessCodeParamPipe } from "../pipes/access-code-param.pipe";

@ApiTags("Institutions")
@Controller("institutions")
export class InstitutionController {
  constructor(private readonly institutionService: InstitutionService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        name: { type: "string", maxLength: 150 },
        stateId: { type: "integer" },
        cityId: { type: "integer" },
        photo: { type: "string", format: "binary" },
      },
      required: ["name", "stateId", "cityId"],
    },
  })
  @UseInterceptors(FileInterceptor("photo"))
  @ResponseMessage("Instituição criada com sucesso")
  @ApiWrappedResponse(InstitutionResponseDto, {
    description: "Cria uma nova instituição",
  })
  async create(
    @Body() dto: CreateInstitutionDto,
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    return this.institutionService.create(dto, photo);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Lista instituições paginadas" })
  @ResponseMessage("Instituições listadas com sucesso")
  @ApiWrappedResponse(InstitutionResponseDto, {
    isArray: true,
    description: "Lista paginada de instituições",
  })
  async findAll(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("perPage", new DefaultValuePipe(10), ParseIntPipe) perPage: number,
  ) {
    return this.institutionService.findAll(page, perPage);
  }

  @Public()
  @Get("validate/:accessCode")
  @ApiOperation({
    summary: "Valida o código de acesso de uma instituição (público)",
  })
  @ResponseMessage("Código de acesso válido")
  @ApiWrappedResponse(InstitutionValidateResponseDto, {
    description: "Retorna id e nome da instituição vinculada ao código",
  })
  async validateAccessCode(
    @Param("accessCode", AccessCodeParamPipe) accessCode: string,
  ) {
    return this.institutionService.validateAccessCode(accessCode);
  }

  @Get(":id")
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ResponseMessage("Instituição encontrada")
  @ApiWrappedResponse(InstitutionResponseDto, {
    description: "Detalhe da instituição",
  })
  async findById(@Param("id", ParseUUIDPipe) id: string) {
    return this.institutionService.findById(id);
  }

  @Put(":id")
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        name: { type: "string", maxLength: 150 },
        stateId: { type: "integer" },
        cityId: { type: "integer" },
        photo: { type: "string", format: "binary" },
      },
    },
  })
  @UseInterceptors(FileInterceptor("photo"))
  @ResponseMessage("Instituição atualizada com sucesso")
  @ApiWrappedResponse(InstitutionResponseDto, {
    description: "Atualiza uma instituição",
  })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateInstitutionDto,
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    return this.institutionService.update(id, dto, photo);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ResponseMessage("Instituição removida com sucesso")
  async delete(@Param("id", ParseUUIDPipe) id: string) {
    await this.institutionService.delete(id);
    return null;
  }
}
