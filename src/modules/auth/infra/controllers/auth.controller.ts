import { Body, Controller, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ResponseMessage } from "@shared/infra/decorators/response-message.decorator";
import { ApiWrappedResponse } from "@shared/infra/swagger/api-response.dto";
import { Public } from "@shared/infra/decorators/public.decorator";
import { RegisterDto } from "../../application/dto/register.dto";
import { LoginDto } from "../../application/dto/login.dto";
import { ForgotPasswordDto } from "../../application/dto/forgot-password.dto";
import { VerifyCodeDto } from "../../application/dto/verify-code.dto";
import { ResetPasswordDto } from "../../application/dto/reset-password.dto";
import { AuthResponseDto } from "../../application/dto/auth-response.dto";
import { AuthService } from "../../application/services/auth.service";
import { PasswordRecoveryService } from "../../application/services/password-recovery.service";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordRecoveryService: PasswordRecoveryService,
  ) {}

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

  @Public()
  @Post("forgot-password")
  @ResponseMessage("Solicitação processada")
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.passwordRecoveryService.requestRecovery(dto.email);
  }

  @Public()
  @Post("verify-code")
  @ResponseMessage("Código verificado")
  async verifyCode(@Body() dto: VerifyCodeDto) {
    return this.passwordRecoveryService.verifyCode(dto.email, dto.code);
  }

  @Public()
  @Post("reset-password")
  @ResponseMessage("Senha redefinida com sucesso")
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.passwordRecoveryService.resetPassword(
      dto.email,
      dto.code,
      dto.newPassword,
    );
  }
}
