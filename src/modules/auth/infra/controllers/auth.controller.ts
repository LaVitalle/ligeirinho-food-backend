import { Body, Controller, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ResponseMessage } from "@shared/infra/decorators/response-message.decorator";
import { ApiWrappedResponse } from "@shared/infra/swagger/api-response.dto";
import { Public } from "@shared/infra/decorators/public.decorator";
import { RegisterDto } from "../../application/dto/register.dto";
import { LoginDto } from "../../application/dto/login.dto";
import { AuthResponseDto } from "../../application/dto/auth-response.dto";
import { AuthService } from "../../application/services/auth.service";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("register")
  @ResponseMessage("Usuário registrado com sucesso")
  @ApiWrappedResponse(AuthResponseDto, { description: "Registro de usuário" })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post("login")
  @ResponseMessage("Login efetuado com sucesso")
  @ApiWrappedResponse(AuthResponseDto, { description: "Login de usuário" })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}

