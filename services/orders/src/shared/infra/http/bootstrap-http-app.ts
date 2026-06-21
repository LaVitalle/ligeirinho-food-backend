import { ValidationPipe, type Type } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

type BootstrapHttpAppOptions = {
  title: string;
  description: string;
  version?: string;
  port?: number | string;
};

/**
 * Bootstrap HTTP padronizado para todos os microsserviços de domínio:
 * CORS, ValidationPipe global e Swagger em /docs (alternável via SWAGGER_ENABLED).
 */
export async function bootstrapHttpApp(
  rootModule: Type<unknown>,
  options: BootstrapHttpAppOptions,
): Promise<void> {
  const app = await NestFactory.create(rootModule);

  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerEnabled = process.env.SWAGGER_ENABLED !== "false";
  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle(options.title)
      .setDescription(options.description)
      .setVersion(options.version ?? "1.0.0")
      .addBearerAuth({ type: "http", scheme: "bearer", bearerFormat: "JWT" })
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("docs", app, document, {
      swaggerOptions: { docExpansion: "none" },
    });
  }

  const port = options.port ?? process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`[${options.title}] rodando na porta ${port}`);
}
