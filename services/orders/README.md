# Ligeirinho Food — Orders Service

Microsserviço de **pedidos**: carrinho, pedidos (máquina de estados), avaliações e relatórios.

- **Porta:** 4003 · **Banco:** `ligeirinho_orders` · **Swagger:** `/docs`

## Responsabilidade
- Carrinho (uma cantina por vez), criação e avanço de pedidos, avaliações e relatórios.
- Autenticação **stateless**.
- Mantém **projeções locais** read-only (`products_view`, `canteens_view`) — nunca consulta o banco do catalog.

## Mensageria (RabbitMQ)
- **Consome** `product.upserted` / `product.deleted` / `canteen.updated` (catalog) → atualiza as projeções locais.
- **Publica** `order.created` e `order.status_changed` → consumidos pelo identity (e-mails).

## Variáveis de ambiente
Ver [`.env.example`](.env.example): `PORT`, `DATABASE_URL`, `JWT_SECRET`, `RABBITMQ_URL`, `SWAGGER_ENABLED`.

## Comandos
```bash
npm install
cp .env.example .env
npm run db:migrate
npm run start:dev
npm run start:prod
npm run db:generate
npm run typecheck
```

## Docker
```bash
docker build -t ligeirinho-orders .
```
