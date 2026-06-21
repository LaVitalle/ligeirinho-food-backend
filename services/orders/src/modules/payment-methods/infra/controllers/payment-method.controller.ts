import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { UserRole } from "@shared/domain/enums/user-role.enum";
import { ResponseMessage } from "@shared/infra/decorators/response-message.decorator";
import { Roles } from "@shared/infra/decorators/roles.decorator";
import { HateoasItem } from "@shared/infra/hateoas/hateoas-item.decorator";
import { HateoasList } from "@shared/infra/hateoas/hateoas-list.decorator";
import { ApiWrappedResponse } from "@shared/infra/swagger/api-response.dto";
import {
  CreatePaymentMethodDto,
  PaymentMethodResponseDto,
  UpdatePaymentMethodDto,
} from "../../application/dto/payment-method.dto";
import { PaymentMethodService } from "../../application/services/payment-method.service";

@ApiTags("PaymentMethods")
@ApiBearerAuth()
@Controller("payment-methods")
export class PaymentMethodController {
  constructor(
    private readonly paymentMethodService: PaymentMethodService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Cria método de pagamento (admin)" })
  @ApiBody({ type: CreatePaymentMethodDto })
  @ResponseMessage("Método de pagamento criado com sucesso")
  @ApiWrappedResponse(PaymentMethodResponseDto, {
    description: "Método de pagamento criado",
  })
  async create(@Body() dto: CreatePaymentMethodDto) {
    return this.paymentMethodService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "Lista métodos de pagamento" })
  @ApiQuery({
    name: "onlyActive",
    required: false,
    type: Boolean,
    description: "Quando true, retorna apenas os métodos com isActive = true",
    example: false,
  })
  @ResponseMessage("Métodos de pagamento listados")
  @ApiWrappedResponse(PaymentMethodResponseDto, {
    isArray: true,
    description: "Lista de métodos de pagamento",
  })
  @HateoasList<PaymentMethodResponseDto>({
    basePath: "/payment-methods",
    itemLinks: (p) => ({
      self: { href: `/payment-methods/${p.id}`, method: "GET" },
      update: { href: `/payment-methods/${p.id}`, method: "PUT" },
      delete: { href: `/payment-methods/${p.id}`, method: "DELETE" },
      toggle: { href: `/payment-methods/${p.id}/toggle`, method: "PATCH" },
    }),
  })
  async findAll(
    @Query("onlyActive", new DefaultValuePipe(false), ParseBoolPipe)
    onlyActive: boolean,
  ) {
    return this.paymentMethodService.findAll(onlyActive);
  }

  @Get(":id")
  @ApiOperation({ summary: "Detalhe de um método de pagamento" })
  @ApiParam({ name: "id", description: "UUID do método de pagamento", example: "c4e5f6a7-8b9c-0d1e-2f3a-4b5c6d7e8f9a" })
  @ResponseMessage("Método encontrado")
  @ApiWrappedResponse(PaymentMethodResponseDto, {
    description: "Detalhe do método de pagamento",
  })
  @HateoasItem<PaymentMethodResponseDto>({
    basePath: "/payment-methods",
    itemLinks: (p) => ({
      self: { href: `/payment-methods/${p.id}`, method: "GET" },
      update: { href: `/payment-methods/${p.id}`, method: "PUT" },
      delete: { href: `/payment-methods/${p.id}`, method: "DELETE" },
      toggle: { href: `/payment-methods/${p.id}/toggle`, method: "PATCH" },
    }),
  })
  async findById(@Param("id", ParseUUIDPipe) id: string) {
    return this.paymentMethodService.findById(id);
  }

  @Put(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Atualiza método de pagamento" })
  @ApiParam({ name: "id", description: "UUID do método de pagamento", example: "c4e5f6a7-8b9c-0d1e-2f3a-4b5c6d7e8f9a" })
  @ApiBody({ type: UpdatePaymentMethodDto })
  @ResponseMessage("Método atualizado com sucesso")
  @ApiWrappedResponse(PaymentMethodResponseDto, {
    description: "Método de pagamento atualizado",
  })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdatePaymentMethodDto,
  ) {
    return this.paymentMethodService.update(id, dto);
  }

  @Patch(":id/toggle")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Alterna isActive do método" })
  @ApiParam({ name: "id", description: "UUID do método de pagamento", example: "c4e5f6a7-8b9c-0d1e-2f3a-4b5c6d7e8f9a" })
  @ResponseMessage("Status do método atualizado")
  @ApiWrappedResponse(PaymentMethodResponseDto, {
    description: "Método com isActive alternado",
  })
  async toggle(@Param("id", ParseUUIDPipe) id: string) {
    return this.paymentMethodService.toggle(id);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Remove método (bloqueia se em uso por pedidos)" })
  @ApiParam({ name: "id", description: "UUID do método de pagamento", example: "c4e5f6a7-8b9c-0d1e-2f3a-4b5c6d7e8f9a" })
  @ResponseMessage("Método removido com sucesso")
  async remove(@Param("id", ParseUUIDPipe) id: string) {
    await this.paymentMethodService.remove(id);
    return null;
  }
}
