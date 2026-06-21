import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";
import { IS_PUBLIC_KEY } from "@shared/infra/decorators/public.decorator";
import type { AuthenticatedUser } from "@shared/infra/auth/authenticated-user.interface";

/**
 * Validação stateless do JWT: verifica apenas a assinatura com o JWT_SECRET
 * compartilhado e popula `request.user` com as claims. Sem acesso ao banco —
 * usado pelos serviços que não são donos da tabela de usuários (catalog/orders).
 */
@Injectable()
export class StatelessJwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);
    if (!token) throw new UnauthorizedException("Token ausente");

    try {
      const payload =
        await this.jwtService.verifyAsync<AuthenticatedUser>(token);
      (request as Request & { user: AuthenticatedUser }).user = payload;
    } catch {
      throw new UnauthorizedException("Token inválido ou expirado");
    }

    return true;
  }

  private extractToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(" ") ?? [];
    return type === "Bearer" ? token : undefined;
  }
}
