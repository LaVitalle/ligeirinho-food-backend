import {
  BaseEnvironmentVariables,
  createEnvValidator,
} from "@shared/infra/config/env.validation";

/**
 * Orders usa apenas as variáveis base (DATABASE_URL, JWT_SECRET, RABBITMQ_URL).
 */
export const validate = createEnvValidator(BaseEnvironmentVariables);
