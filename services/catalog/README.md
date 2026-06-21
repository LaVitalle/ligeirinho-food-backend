# Ligeirinho Food — Catalog Service

Microsserviço de **catálogo**: cantinas, categorias, produtos e adicionais (extras). Imagens via MinIO.

- **Porta:** 4002 · **Banco:** `ligeirinho_catalog` · **Swagger:** `/docs`

## Responsabilidade
- CRUD de cantinas (com `seller_id` preenchido por evento), categorias, produtos e adicionais.
- Autenticação **stateless** (verifica assinatura do JWT; sem tabela de usuários).

## Mensageria (RabbitMQ)
- **Publica** `canteen.created` (dispara criação do SELLER no identity), `canteen.updated`, `canteen.deleted`, `product.upserted`, `product.deleted`.
- **Consome** `seller.created` (identity) → grava `canteen.seller_id`.

## Variáveis de ambiente
Ver [`.env.example`](.env.example): `PORT`, `DATABASE_URL`, `JWT_SECRET`, `RABBITMQ_URL`, `SWAGGER_ENABLED`, `MINIO_*`.

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
docker build -t ligeirinho-catalog .
```
