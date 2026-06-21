import { bootstrapHttpApp } from "@shared/infra/http/bootstrap-http-app";
import { AppModule } from "./app.module";

void bootstrapHttpApp(AppModule, {
  title: "Ligeirinho Food — Orders API",
  description:
    "Carrinho, pedidos, avaliações e relatórios. Publica order.created/status_changed; consome product.*/canteen.updated (projeções locais).",
  port: process.env.PORT ?? 4003,
});
