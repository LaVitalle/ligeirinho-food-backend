import { existsSync, statSync, unlinkSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

const SWAGGER_LOCK = join(tmpdir(), "ligeirinho-swagger.lock");

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>("PORT", 3000);

  if (configService.get<boolean>("SWAGGER_ENABLED", true)) {
    const config = new DocumentBuilder()
      .setTitle("Ligeirinho Food API")
      .setDescription("API do Ligeirinho Food")
      .setVersion("0.0.1")
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup("docs", app, document, {
      swaggerOptions: { docExpansion: "none" },
    });
  }

  await app.listen(port);

  const swaggerUrl = `http://localhost:${port}/docs`;
  console.log(`Application running on port ${port}`);

  if (
    process.env.NODE_ENV === "development" &&
    configService.get<boolean>("SWAGGER_ENABLED", true)
  ) {
    const isLockFresh =
      existsSync(SWAGGER_LOCK) &&
      Date.now() - statSync(SWAGGER_LOCK).mtimeMs < 4 * 60 * 60 * 1000;

    if (!isLockFresh) {
      writeFileSync(SWAGGER_LOCK, "");
      const open = await import("open");
      open.default(swaggerUrl);
    }
  }
}

process.on("SIGINT", () => {
  try {
    unlinkSync(SWAGGER_LOCK);
  } catch {}
  process.exit();
});

bootstrap();
