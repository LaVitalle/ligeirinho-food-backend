import { bootstrapHttpApp } from "@shared/infra/http/bootstrap-http-app";
import { AppModule } from "./app.module";

void bootstrapHttpApp(AppModule, {
  title: "Ligeirinho Food — Catalog API",
  description:
    "Cantinas, categorias, produtos e adicionais. Publica canteen.created/updated e product.upserted/deleted; consome seller.created.",
  port: process.env.PORT ?? 4002,
});
