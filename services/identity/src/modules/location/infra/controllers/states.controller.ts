import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ResponseMessage } from "@shared/infra/decorators/response-message.decorator";
import { ApiWrappedResponse } from "@shared/infra/swagger/api-response.dto";
import { Public } from "@shared/infra/decorators/public.decorator";
import { StateDto } from "../../application/dto/state.dto";
import { LocationService } from "../../application/services/location.service";

@ApiTags("Location")
@Controller("states")
export class StatesController {
  constructor(private readonly locationService: LocationService) {}

  @Get()
  @Public()
  @ResponseMessage("Estados listados com sucesso")
  @ApiWrappedResponse(StateDto, {
    isArray: true,
    description: "Lista de todos os estados brasileiros",
  })
  async findAll() {
    return this.locationService.findAllStates();
  }
}
