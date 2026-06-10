import { UserRole } from "@shared/domain/enums/user-role.enum";

/**
 * Claims do JWT. É o que os serviços stateless (catalog/orders) recebem em
 * `request.user` — sem lookup no banco. O identity-service emite o token com
 * exatamente estes campos.
 */
export interface AuthenticatedUser {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
  institutionId: string | null;
  canteenId: string | null;
}
