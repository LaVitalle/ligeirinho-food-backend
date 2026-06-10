# Ligeirinho Food — Backend (Microsserviços)

Sistema de delivery de alimentos para instituições (Projeto Integrador do 5° semestre), rearquitetado como **microsserviços NestJS** com comunicação **assíncrona via RabbitMQ**, **um banco PostgreSQL por serviço** e **API Gateway** único na frente.

Este repositório é o **monorepo de desenvolvimento**. Cada serviço é autossuficiente e, para deploy, vai para o seu próprio repositório (ver [Split & Deploy](#split--deploy)).

## Arquitetura

```
                    ┌─────────────────────┐
  Frontend ─HTTP──▶ │  gateway   :4000    │  (1 base URL · agrega /docs)
                    └───┬───────┬─────────┘
            /auth /users│ /...  │ /cart /orders ...
        /institutions   │       │
        ┌───────────────▼─┐ ┌───▼──────────┐ ┌──────────────┐
        │ identity :4001  │ │ catalog :4002│ │ orders :4003 │
        │ auth · users    │ │ canteens     │ │ cart · orders│
        │ institutions    │ │ categories   │ │ ratings      │
        │ location · email│ │ products     │ │ reports      │
        └──────┬──────────┘ │ extras       │ └──────┬───────┘
        ligeirinho_identity └───┬──────────┘   ligeirinho_orders
          (Postgres)        ligeirinho_catalog   (Postgres)
                │            (Postgres)              │
                └───────────────┬────────────────────┘
                          ┌─────▼──────┐
                          │  RabbitMQ  │  (exchanges direct, 1 por evento)
                          └────────────┘
```

| Serviço | Porta | Banco | Responsabilidade |
|---|---|---|---|
| `gateway` | 4000 | — | Reverse proxy + Swagger agregado (entrada única) |
| `identity` | 4001 | `ligeirinho_identity` | Autenticação, usuários, instituições, localização, e-mail |
| `catalog` | 4002 | `ligeirinho_catalog` | Cantinas, categorias, produtos, adicionais (MinIO) |
| `orders` | 4003 | `ligeirinho_orders` | Carrinho, pedidos, avaliações, relatórios |

### Comunicação assíncrona (RabbitMQ)

| Evento (routing key) | Publica | Consome | Efeito |
|---|---|---|---|
| `canteen.created` | catalog | identity | identity cria o SELLER (1:1) e publica `seller.created` |
| `seller.created` | identity | catalog | catalog grava `canteen.seller_id` |
| `canteen.updated` | catalog | orders | projeção local `canteens_view` |
| `product.upserted` / `product.deleted` | catalog | orders | projeção local `products_view` |
| `order.created` | orders | identity | e-mail de confirmação ao cliente |
| `order.status_changed` | orders | identity | e-mail de atualização de status |

> **Sem compartilhamento de banco**: o orders nunca lê o banco do catalog — ele mantém cópias read-only (`products_view`, `canteens_view`) alimentadas por eventos (consistência eventual).

## Stack

| Tecnologia | Uso |
|---|---|
| NestJS 11 | Framework HTTP |
| TypeScript | Linguagem |
| PostgreSQL 17 | Banco (um por serviço) |
| Drizzle ORM | ORM e migrations |
| RabbitMQ (amqplib) | Mensageria assíncrona |
| MinIO | Objetos/imagens (catalog) |
| JWT + bcrypt | Autenticação (stateless nos serviços) |
| Swagger / OpenAPI + HATEOAS | Documentação e hipermídia |

## Pré-requisitos

- [Docker](https://www.docker.com/) + Docker Compose (sobe tudo)
- [Node.js](https://nodejs.org/) >= 20 (apenas para rodar serviços fora do Docker)

## Subir tudo (recomendado)

```bash
docker compose up -d --build
```

Sobe Postgres (com os 3 bancos), RabbitMQ, MinIO, Adminer e os 4 serviços. As migrations rodam no boot de cada serviço.

| Recurso | URL |
|---|---|
| Gateway (entrada única) | http://localhost:4000 |
| Swagger identity | http://localhost:4000/identity/docs · http://localhost:4001/docs |
| Swagger catalog | http://localhost:4000/catalog/docs · http://localhost:4002/docs |
| Swagger orders | http://localhost:4000/orders/docs · http://localhost:4003/docs |
| RabbitMQ Management | http://localhost:15672 (ligeirinho/ligeirinho) |
| Adminer (DB UI) | http://localhost:8080 |
| MinIO Console | http://localhost:9001 |

Seed do admin (identity):

```bash
docker compose exec identity npm run db:seed:admin
docker compose exec identity npm run db:seed:location
```

Parar / limpar:

```bash
docker compose down       # para os containers
docker compose down -v    # para e apaga os volumes (dados)
```

## Desenvolvimento por serviço (sem Docker)

```bash
cd services/identity        # (ou catalog / orders / gateway)
cp .env.example .env        # ajuste as variáveis
npm install
npm run db:migrate          # serviços de domínio
npm run start:dev
```

## Código compartilhado (shared)

A fonte canônica fica em [`shared/src`](shared/src) (envelope de resposta + HATEOAS, guards, mensageria, contratos de eventos, etc.). Ela é **vendorizada** em cada serviço (`services/<svc>/src/shared`) por:

```bash
npm run shared:sync
```

Edite sempre em `shared/src` e rode o sync — nunca edite as cópias dentro dos serviços.

## Split & Deploy

Cada serviço é deployado a partir do seu **próprio repositório GitHub** (App no EasyPanel, build por Dockerfile). Para publicar:

```bash
export REPO_GATEWAY=git@github.com:voce/ligeirinho-gateway.git
export REPO_IDENTITY=git@github.com:voce/ligeirinho-identity.git
export REPO_CATALOG=git@github.com:voce/ligeirinho-catalog.git
export REPO_ORDERS=git@github.com:voce/ligeirinho-orders.git
npm run split
```

No EasyPanel: 1 RabbitMQ + 3 Postgres + (1 MinIO) + 4 Apps. O `JWT_SECRET` deve ser **idêntico** em identity/catalog/orders (verificação stateless). Detalhes no plano de migração e em [`docs/arquitetura.md`](docs/arquitetura.md).

## Contrato de resposta

Todas as respostas seguem o envelope padrão; endpoints com hipermídia trazem `_links`:

```json
{
  "data": { "id": "...", "_links": { "self": { "href": "/products/1", "method": "GET" } } },
  "status": { "code": 200, "message": "Mensagem amigável" },
  "pagination": {}
}
```

## Scripts do monorepo

```bash
npm run shared:sync     # vendoriza shared/src nos serviços
npm run install:all     # npm install em todos os serviços
npm run typecheck:all   # tsc --noEmit em todos os serviços
npm run compose:up      # docker compose up -d --build
npm run compose:down    # docker compose down
npm run split           # publica cada serviço no seu repo (ver acima)
```
