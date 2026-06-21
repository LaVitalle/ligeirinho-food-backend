import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { UserRole } from "@shared/domain/enums/user-role.enum";
import { CurrentUser } from "@shared/infra/decorators/current-user.decorator";
import { ResponseMessage } from "@shared/infra/decorators/response-message.decorator";
import { Roles } from "@shared/infra/decorators/roles.decorator";
import type { AuthenticatedUser } from "@shared/infra/auth/authenticated-user.interface";
import { ReportService } from "../../application/services/report.service";

@ApiTags("Reports")
@ApiBearerAuth()
@Controller("reports")
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get("revenue")
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  @ApiOperation({ summary: "Receita por período" })
  @ResponseMessage("Receita calculada")
  async revenue(
    @CurrentUser() user: AuthenticatedUser,
    @Query("canteenId") canteenId?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    const id = canteenId ?? user.canteenId!;
    return this.reportService.revenue(id, from, to);
  }

  @Get("orders-count")
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  @ApiOperation({ summary: "Total de pedidos por período" })
  @ResponseMessage("Contagem calculada")
  async ordersCount(
    @CurrentUser() user: AuthenticatedUser,
    @Query("canteenId") canteenId?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    const id = canteenId ?? user.canteenId!;
    return this.reportService.ordersCount(id, from, to);
  }

  @Get("revenue-trend")
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  @ApiOperation({ summary: "Tendência de receita 7 dias" })
  @ResponseMessage("Tendência calculada")
  async revenueTrend(
    @CurrentUser() user: AuthenticatedUser,
    @Query("canteenId") canteenId?: string,
  ) {
    const id = canteenId ?? user.canteenId!;
    return this.reportService.revenueTrend(id);
  }

  @Get("top-products")
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  @ApiOperation({ summary: "Ranking dos produtos mais vendidos" })
  @ResponseMessage("Top produtos calculados")
  async topProducts(
    @CurrentUser() user: AuthenticatedUser,
    @Query("canteenId") canteenId?: string,
    @Query("limit", new DefaultValuePipe(5), ParseIntPipe) limit?: number,
    @Query("days", new DefaultValuePipe(30), ParseIntPipe) days?: number,
  ) {
    const id = canteenId ?? user.canteenId!;
    return this.reportService.topProducts(id, limit, days);
  }

  @Get("admin-counts")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Contagens globais (instituições e cantinas)" })
  @ResponseMessage("Contagens retornadas")
  async adminCounts() {
    return this.reportService.adminCounts();
  }
}
