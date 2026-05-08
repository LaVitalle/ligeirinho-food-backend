import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Query,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "@shared/infra/decorators/public.decorator";
import { ResponseMessage } from "@shared/infra/decorators/response-message.decorator";
import { RatingService } from "../../application/services/rating.service";

@ApiTags("Ratings")
@Controller("canteens")
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @Get(":id/ratings")
  @Public()
  @ApiOperation({ summary: "Lista avaliações da cantina" })
  @ResponseMessage("Avaliações listadas")
  async getRatings(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("perPage", new DefaultValuePipe(10), ParseIntPipe) perPage: number,
  ) {
    return this.ratingService.getCanteenRatings(id, page, perPage);
  }

  @Get(":id/rating")
  @Public()
  @ApiOperation({ summary: "Média de avaliações da cantina" })
  @ResponseMessage("Média calculada")
  async getAverage(@Param("id", ParseUUIDPipe) id: string) {
    return this.ratingService.getCanteenAverage(id);
  }
}
