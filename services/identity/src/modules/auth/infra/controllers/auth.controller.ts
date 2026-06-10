import { Body, Controller, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { ResponseMessage } from "@shared/infra/decorators/response-message.decorator";
import { ApiWrappedResponse } from "@shared/infra/swagger/api-response.dto";
import { Public } from "@shared/infra/decorators/public.decorator";
import { RegisterDto } from "../../application/dto/register.dto";
import { LoginDto } from "../../application/dto/login.dto";
import { ForgotPasswordDto } from "../../application/dto/forgot-password.dto";
import { VerifyCodeDto } from "../../application/dto/verify-code.dto";
import { ResetPasswordDto } from "../../application/dto/reset-password.dto";
import { ReactivationRequestDto } from "../../application/dto/reactivation-request.dto";
import { ReactivationConfirmDto } from "../../application/dto/reactivation-confirm.dto";
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
  @ApiOperation({
    summary: "Registrar novo cliente",
    description:
      "Cria uma conta de CUSTOMER vinculada à instituição identificada pelo accessCode. Endpoint público — não requer autenticação.",
  })
  @ResponseMessage("Usuário registrado com sucesso")
  @ApiWrappedResponse(AuthResponseDto, { description: "Registro de usuário" })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post("login")
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @ResponseMessage("Login efetuado com sucesso")
  @ApiWrappedResponse(AuthResponseDto, { description: "Login de usuário" })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post("forgot-password")
  @Throttle({ default: { ttl: 600_000, limit: 3 } })
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

  @Public()
  @Post("reactivation/request")
  @Throttle({ default: { ttl: 600_000, limit: 3 } })
  @ApiOperation({ summary: "Solicitar reativação de conta desativada" })
  @ResponseMessage("Solicitação processada")
  async requestReactivation(@Body() dto: ReactivationRequestDto) {
    return this.passwordRecoveryService.requestReactivation(dto.email);
  }

  @Public()
  @Post("reactivation/confirm")
  @ApiOperation({ summary: "Confirmar reativação de conta com código" })
  @ResponseMessage("Conta reativada com sucesso")
  @ApiWrappedResponse(AuthResponseDto, { description: "Conta reativada" })
  async confirmReactivation(@Body() dto: ReactivationConfirmDto) {
    return this.passwordRecoveryService.confirmReactivation(
      dto.email,
      dto.code,
    );
  }
}
