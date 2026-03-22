import { Controller, Get, Param, ParseIntPipe } from "@nestjs/common";
import { ApiParam, ApiTags } from "@nestjs/swagger";
import { ResponseMessage } from "@shared/infra/decorators/response-message.decorator";
import { ApiWrappedResponse } from "@shared/infra/swagger/api-response.dto";
import { Public } from "@shared/infra/decorators/public.decorator";
import { CityDto } from "../../application/dto/city.dto";
import { LocationService } from "../../application/services/location.service";

@ApiTags("Location")
@Controller("cities")
export class CitiesController {
  constructor(private readonly locationService: LocationService) {}

  @Get(":stateId")
  @Public()
  @ResponseMessage("Cidades listadas com sucesso")
  @ApiWrappedResponse(CityDto, {
    isArray: true,
    description: "Lista de cidades por estado",
  })
  @ApiParam({
    name: "stateId",
    description: "Codigo IBGE do estado",
    example: 35,
  })
  async findByStateId(@Param("stateId", ParseIntPipe) stateId: number) {
    return this.locationService.findCitiesByStateId(stateId);
  }
}
