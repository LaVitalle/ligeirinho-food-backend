import { bootstrapHttpApp } from "@shared/infra/http/bootstrap-http-app";
import { AppModule } from "./app.module";

void bootstrapHttpApp(AppModule, {
  title: "Ligeirinho Food — Identity API",
  description:
    "Autenticação, usuários, instituições e localização. Publica seller.created; consome canteen.created e eventos de pedidos.",
  port: process.env.PORT ?? 4001,
});
