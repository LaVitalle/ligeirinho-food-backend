# CLAUDE.md — Ligeirinho Food Backend

> Doc de referência para o Claude Code e qualquer dev (humano ou IA) trabalhando neste repositório.

---

## 1. Visão geral

**Ligeirinho Food** é um sistema de delivery de alimentos voltado para instituições (universidades, escolas, empresas), desenvolvido como **Projeto Integrador do 5° semestre**. Cada instituição possui um `access_code` que clientes usam para se cadastrar e acessar as cantinas daquela instituição.

**Atores (4 roles):**
- **ADMIN** — administrador global. Cria instituições, cria outros ADMINs e INSTITUTION_ADMINs. Não pertence a instituição.
- **INSTITUTION_ADMIN** — administra **uma** instituição. Cria/gerencia cantinas (e o SELLER de cada uma) dentro da própria instituição. **Não** cria outros INSTITUTION_ADMINs.
- **SELLER** — vendedor exclusivo de **uma** cantina (1:1). Criado junto com a cantina. Gerencia produtos, adicionais, ingredientes e fila de pedidos. Não pode ser excluído enquanto a cantina tiver pedidos abertos.
- **CUSTOMER** — cliente final. Auto-cadastro público após validar `access_code`. Pode migrar de instituição.

**Fluxo principal:**
1. ADMIN cadastra instituição (gera `access_code` aleatório de 6 dígitos) e atribui um INSTITUTION_ADMIN.
2. INSTITUTION_ADMIN cadastra cantinas da própria instituição — cada cantina cria automaticamente um SELLER vinculado.
3. SELLER cadastra produtos, adicionais e ingredientes removíveis da própria cantina.
4. CUSTOMER se registra publicamente usando o `access_code` da sua instituição.
5. CUSTOMER monta carrinho (apenas de uma cantina por vez) e cria pedido.
6. SELLER avança pedido pela máquina de estados; CUSTOMER confirma retirada.
7. CUSTOMER avalia o pedido finalizado.

**Quem pode criar cada tipo de usuário:**

| Tipo | Criado por | Como |
|---|---|---|
| ADMIN | ADMIN | Endpoint admin `POST /users` ou seed inicial |
| INSTITUTION_ADMIN | ADMIN (apenas) | Endpoint admin `POST /users` |
| SELLER | INSTITUTION_ADMIN ou ADMIN | Como efeito colateral de criar uma cantina (1:1) |
| CUSTOMER | Auto-cadastro público | `POST /auth/register` com `access_code` válido |

---

## 2. Requisitos acadêmicos do projeto

Estes são exigências do PI (não são "nice-to-have"):

| Requisito | Estado | Observação |
|---|---|---|
| **3 microserviços** | ✅ Implementado | `identity`, `catalog`, `orders` (+ `gateway`). Cada um com seu próprio banco Postgres e responsabilidade bem definida. |
| **Mensageria (publisher + consumer)** | ✅ Implementado | RabbitMQ (`amqplib`). Cada serviço publica e consome eventos (ver §4.2). Projeções locais garantem isolamento de banco. |
| **Banco por serviço** | ✅ Implementado | `ligeirinho_identity`, `ligeirinho_catalog`, `ligeirinho_orders`. Sem acesso cruzado — dados replicados por eventos (`*_view`). |
| **Swagger / OpenAPI** | ✅ Implementado | `/docs` por serviço; gateway agrega em `/identity/docs`, `/catalog/docs`, `/orders/docs`. |
| **HATEOAS** | ✅ Implementado | `@HateoasItem`/`@HateoasList` injetam `_links` no envelope via `TransformInterceptor` (shared). |

**Topologia (implementada):**
- Monorepo de **desenvolvimento** em `services/*`; cada serviço é **autossuficiente** (shared vendorizado) e vai para o **seu próprio repo GitHub** no deploy (EasyPanel). Ver `README.md` → *Split & Deploy*.
- Divisão por bounded context: `identity` (auth+users+institutions+location), `catalog` (canteens+categories+products+extras), `orders` (cart+orders+ratings+reports), `gateway` (proxy + Swagger agregado).
- Comunicação **assíncrona** via RabbitMQ; nunca por acesso direto a banco de outro serviço.

---

## 3. Stack

| Tecnologia | Uso |
|---|---|
| **NestJS 11** | Framework HTTP |
| **TypeScript ES2023** | Linguagem |
| **PostgreSQL 17** | Banco de dados relacional (um por serviço) |
| **Drizzle ORM** | ORM e migrations |
| **RabbitMQ (amqplib)** | Mensageria assíncrona entre serviços |
| **MinIO** | Armazenamento de objetos (imagens, no catalog) |
| **Nodemailer** | Envio de e-mail SMTP |
| **JWT + Passport + bcryptjs** | Autenticação |
| **class-validator / class-transformer** | Validação de DTOs |
| **Swagger / OpenAPI** | Documentação da API |
| **Docker Compose** | PostgreSQL + MinIO no ambiente de dev |

---

## 4. Arquitetura

**Padrão: microsserviços NestJS (Clean Architecture + DDD por serviço), monorepo de dev + polyrepo de deploy.**

### 4.1 Estrutura do monorepo

```
ligeirinho-food-backend/        (monorepo de DEV — não é deployado direto)
├── shared/src/                 ← fonte canônica do código compartilhado
│   ├── application/dto/         ← PaginatedResult
│   ├── domain/enums/            ← UserRole
│   ├── contracts/events/        ← enums + payloads dos eventos (RabbitMQ)
│   └── infra/                   ← drizzle, messaging, hateoas, http/bootstrap,
│                                  guards, auth (stateless), email, storage, ...
├── services/
│   ├── gateway/                 ← reverse proxy (Express) + Swagger agregado
│   ├── identity/                ← auth, users, institutions, location, email
│   ├── catalog/                 ← canteens, categories, products, extras (MinIO)
│   └── orders/                  ← cart, orders, ratings, reports (+ projeções)
├── docker/postgres/init/        ← cria os 3 bancos
├── docker-compose.yml           ← Postgres + RabbitMQ + MinIO + Adminer + 4 apps
└── scripts/{shared-sync,split-repos}.mjs
```

Cada `services/<svc>` é **autossuficiente**: tem `package.json`, `Dockerfile`, `drizzle/` e uma **cópia vendorizada** do shared em `src/shared` (alias `@shared/*`). A fonte canônica é `shared/src`; `npm run shared:sync` propaga para os serviços. **Edite só em `shared/src`.**

Dentro de cada serviço, cada módulo mantém as 3 camadas DDD:

```
src/modules/<modulo>/
├── domain/        ← models (restore()/withX()) + repositories (interfaces + Symbol tokens)
├── application/   ← services (casos de uso) + dto + *-messaging.service.ts (publishers)
└── infra/         ← controllers + repositories (Drizzle) + schemas
```

**Regras invioláveis:**
- `domain` não importa de `application` nem `infra`; `application` não importa de `infra`.
- `controllers` só delegam para o service; repositórios são injetados via Symbol token (DIP).
- **Nenhum serviço acessa o banco de outro.** Dados de outro contexto chegam por **evento** e viram projeção local read-only (ex.: `products_view`, `canteens_view` no orders).
- Auth: `identity` é dono dos usuários (lookup no DB via Passport). `catalog`/`orders` usam `StatelessAuthModule` (verificam só a assinatura do JWT; claims em `AuthenticatedUser`).

### 4.2 Eventos (RabbitMQ — 1 exchange `direct`/durável por evento)

Publishers em `*-messaging.service.ts` (assertExchange no `OnApplicationBootstrap`); consumers em `*-message-consumer.service.ts` (canal próprio + assertQueue/bind/consume + ack/nack). Contratos em `shared/src/contracts/events/`.

| Evento | Publica | Consome | Efeito |
|---|---|---|---|
| `canteen.created` | catalog | identity | cria SELLER → publica `seller.created` |
| `seller.created` | identity | catalog | grava `canteen.seller_id` |
| `canteen.updated` | catalog | orders | projeção `canteens_view` |
| `product.upserted`/`product.deleted` | catalog | orders | projeção `products_view` |
| `order.created` | orders | identity | e-mail de confirmação |
| `order.status_changed` | orders | identity | e-mail de status |

Detalhes completos: [docs/arquitetura.md](docs/arquitetura.md).

### Código compartilhado (`shared/src`)

`shared.module.ts` (global: DrizzleService, RabbitMQService, SharedMessagingService, ErrorLogRepository, TransformInterceptor, GlobalExceptionFilter) + `domain/enums` (UserRole) + `application/dto` (PaginatedResult) + `contracts/events` (eventos) + `infra/`: `config` (env base + `createEnvValidator`), `database` (DrizzleService), `decorators`, `email` (EmailModule — opcional), `storage` (StorageModule — opcional), `filters`, `guards` (JwtAuthGuard Passport + RolesGuard), `auth` (StatelessAuthModule + StatelessJwtAuthGuard + AuthenticatedUser), `hateoas`, `http` (bootstrapHttpApp), `interceptors`, `messaging` (RabbitMQService + SharedMessagingService), `repositories`, `schemas`, `swagger`.

### Serviços e módulos

| Serviço | Porta / DB | Módulos | Estado |
|---|---|---|---|
| `gateway` | 4000 / — | reverse proxy + Swagger agregado | ✅ |
| `identity` | 4001 / `ligeirinho_identity` | auth, users, location, institutions, integration (consumers/publisher) | ✅ |
| `catalog` | 4002 / `ligeirinho_catalog` | canteens, categories, products, extras | ✅ |
| `orders` | 4003 / `ligeirinho_orders` | cart, orders, ratings, reports, projections | ✅ |

Backlog de features: [docs/backlog-backend.md](docs/backlog-backend.md).

---

## 5. Padrões e convenções

### Envelope de resposta (global)

Toda resposta passa pelo `TransformInterceptor`:

```json
{
  "data": {},
  "status": { "code": 200, "message": "Mensagem amigável" },
  "pagination": {}
}
```

Decorators relacionados:
- `@ResponseMessage("texto")` define `status.message`.
- `@ApiWrappedResponse(Dto, { isArray, description })` documenta no Swagger.

Detalhes: [docs/padronizacao-responses.md](docs/padronizacao-responses.md).

### Tratamento de erros

- Lançar exceções Nest (`NotFoundException`, `ConflictException`, `BadRequestException`, etc.) no service.
- O `GlobalExceptionFilter` formata no envelope padrão e persiste em `error_logs`.

### Paginação (limit + 1)

`PaginatedResult.fromRows(items, page, perPage)` — repositório busca `perPage + 1` para detectar `hasNextPage` sem `COUNT`.

### Autenticação e autorização

- `JwtAuthGuard` global → toda rota é autenticada por padrão.
- `RolesGuard` global → restringe por role com `@Roles(UserRole.X)`.
- `@Public()` libera autenticação na rota.
- `@CurrentUser()` injeta o usuário do JWT.

### Convenções de nomenclatura

| Elemento | Convenção | Exemplo |
|---|---|---|
| Entidade | PascalCase | `Institution` |
| DTO | PascalCase + `Dto` | `InstitutionResponseDto` |
| Service | PascalCase + `Service` | `InstitutionService` |
| Controller | PascalCase + `Controller` | `InstitutionController` |
| Repository (interface) | PascalCase + `Repository` | `InstitutionRepository` |
| Repository (impl) | `Drizzle` + PascalCase + `Repository` | `DrizzleInstitutionRepository` |
| Token DI | `UPPER_SNAKE_CASE` | `INSTITUTION_REPOSITORY` |
| Tabelas | snake_case plural | `institutions` |
| Colunas | snake_case | `created_at` |

### Padrão de entidade de domínio

```typescript
export class Institution {
  private readonly _id: string;
  private _name: string;
  private constructor(id: string) { this._id = id; }

  get id() { return this._id; }
  get name() { return this._name; }

  withName(name: string): this { this._name = name; return this; }

  static restore(props?: { id: string; name: string }): Institution | null {
    if (!props) return null;
    const i = new Institution(props.id);
    i._name = props.name;
    return i;
  }
}
```

### Path aliases

```
@shared/*    → src/shared/*
```

(Outros aliases por módulo são adicionados conforme necessidade.)

### Decisões transversais (defaults — sujeitas a revisão na implementação)

- **Multi-tenant tardio:** filtro automático por instituição entra perto do fim. Endpoints intermediários recebem `institutionId` explícito.
- **Soft delete:** `users.deleted_at` (auth) e `products.deleted_at` para preservar histórico de pedidos.
- **Destaques curados:** campo `is_featured` no produto, marcado pelo SELLER.
- **Registro público restrito a CUSTOMER:** `POST /auth/register` aceita **apenas** CUSTOMER e exige `accessCode` válido. ADMIN/INSTITUTION_ADMIN/SELLER são criados em endpoints autenticados.
- **Email reusável após soft delete:** unique index parcial em `users.email WHERE deleted_at IS NULL`. Conta soft-deleted pode ser reativada via reset de senha OU rota dedicada de reativação por confirmação de email — desde que o email não tenha sido tomado por um novo cadastro.
- **JWT com lookup no DB:** `JwtStrategy.validate()` busca o `User` no banco a cada request, valida `deleted_at IS NULL` e retorna o `User` do domínio. Trade-off consciente: 1 query/request em troca de invalidação imediata de ban/role-change.
- **SELLER imutável quanto à exclusão:** SELLER não é excluído com pedidos abertos; a regra é cantina ↔ usuário 1:1.
- **CUSTOMER pode migrar de instituição:** rota dedicada que valida novo `accessCode` e troca `institution_id`.

---

## 6. Comandos

### Aplicação

```bash
npm run dev            # NestJS em watch mode
npm run dev:debug      # watch + debugger (porta 9229)
npm run build          # compila para dist/
npm run start:prod     # roda dist/ (produção)
```

### Banco de dados (Drizzle)

```bash
npm run db:generate    # gera migrations a partir dos schemas
npm run db:migrate     # aplica migrations
npm run db:push        # push direto (sem migration — usado hoje no dev)
npm run db:studio      # abre Drizzle Studio
```

### Seeds

```bash
npm run db:seed:location       # popula estados e cidades (BR)
npm run db:seed:admin          # cria usuário admin inicial
npm run db:seed:location:prod  # idem, mas com .env.production
npm run db:seed:admin:prod     # idem
```

### Docker (dev local)

```bash
docker compose up -d           # sobe Postgres + MinIO
docker compose down            # para containers
docker compose down -v         # para + apaga volumes
```

---

## 7. Variáveis de ambiente

Validadas no boot por [src/shared/infra/config/env.validation.ts](src/shared/infra/config/env.validation.ts) — a aplicação **derruba o startup** se faltar alguma obrigatória.

| Variável | Obrigatória | Descrição |
|---|---|---|
| `PORT` | Não (default 3000) | Porta da API |
| `DATABASE_URL` | Sim | Connection string do Postgres |
| `JWT_SECRET` | Sim | Chave de assinatura JWT |
| `MINIO_SERVER_URL` | Sim | URL do MinIO |
| `MINIO_ROOT_USER` | Sim | Usuário do MinIO |
| `MINIO_ROOT_PASSWORD` | Sim | Senha do MinIO |
| `MINIO_BUCKET` | Sim | Bucket onde objetos são salvos |
| `SWAGGER_ENABLED` | Não (default true) | Habilita `/docs` |
| `SMTP_HOST` | Sim | Host SMTP |
| `SMTP_PORT` | Não (default 587) | Porta SMTP |
| `SMTP_USER` | Sim | Usuário SMTP |
| `SMTP_PASS` | Sim | Senha SMTP |
| `SMTP_FROM` | Não | Remetente padrão |

Convenção de paths: `envs/.env.development` e `envs/.env.production`.

---

## 8. Diretórios importantes

```
.
├── CLAUDE.md                        ← este arquivo
├── README.md                        ← guia de setup
├── docs/
│   ├── arquitetura.md               ← detalhes da arquitetura DDD
│   ├── padronizacao-responses.md    ← contrato de resposta
│   └── backlog-backend.md           ← 46 tasks BE com critérios de aceite
├── docker-compose.yml               ← Postgres + MinIO local
├── drizzle.config.ts                ← config do Drizzle
├── envs/                            ← .env.development / .env.production
├── scripts/                         ← scripts utilitários (migrate.js)
├── src/                             ← código-fonte
└── .claude/agents/                  ← agentes Claude Code customizados
```

---

## 9. Como o Claude Code deve operar neste repo

### Processo de desenvolvimento — 7 fases

Toda task do backlog passa pelo processo formal de desenvolvimento, com **um agente especializado por fase**:

| # | Fase | Agente |
|---|------|--------|
| 1 | Descoberta | `task-discovery` |
| 2 | Análise | `task-analysis` |
| 3 | Planejamento | `task-planning` |
| 4 | Implementação | `task-implementation` |
| 5 | Code Review | `architecture-reviewer` |
| 6 | Documentação Swagger/HyperOAS | `swagger-documenter` |
| 7 | Commit (sem co-autor) | `commit-writer` |

Detalhes em [docs/processo-desenvolvimento.md](docs/processo-desenvolvimento.md).

### Antes de implementar qualquer task
- **Sempre** consultar [docs/backlog-backend.md](docs/backlog-backend.md) e mapear a feature pedida para uma task do backlog.
- **Abrir conversa sobre regras de negócio** antes de codar — critérios de aceite no doc são pontos de partida, não decisões fechadas.
- Confirmar trade-offs técnicos sensíveis (schema, autorização, soft delete, etc.) antes de implementar.

### Ao escrever código
- Seguir DDD por camadas: nada de lógica de negócio em controller; nada de framework em domain.
- Usar `@ResponseMessage` + `@ApiWrappedResponse` em todo endpoint novo.
- Lançar exceções Nest no service — nunca retornar erros como dados.
- Validar DTOs com `class-validator`.
- Schemas Drizzle em `infra/schemas/`, sempre com `created_at`/`updated_at` quando aplicável.
- Symbol token para repositório, registrado no module com `useExisting`.
- Quando criar endpoints, **considerar HyperOAS** (links de ações relacionadas no `data`).

### Ao commitar
- Commits sem co-autor ("Co-Authored-By"). Mensagens claras, sem detalhes técnicos demais.

### Ao planejar microserviços (futuro)
- Não dividir antes de discussão explícita. Por enquanto, foco em manter os módulos coesos e baixa-acoplados — isso garante que a divisão futura seja viável.
