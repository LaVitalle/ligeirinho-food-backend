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
| **3 microserviços** | ❌ Não iniciado | Vamos seguir com **Modular Monolith** até definirmos exatamente como dividir os bounded contexts em serviços separados. A arquitetura DDD atual **já facilita** essa quebra futura — cada módulo é um candidato a microserviço. |
| **Swagger / OpenAPI** | ✅ Implementado | Habilitado em `/docs`, abre automaticamente em dev. DTOs documentados via `@ApiWrappedResponse(Model)`. |
| **HyperOAS / HATEOAS** | ❌ Não iniciado | Hipermídia como engine do estado da aplicação. Endpoints precisarão retornar `_links` com ações relacionadas (ex.: pedido em `AGUARDANDO` traz link `advance`, `cancel`, etc.). Implementação será incremental conforme cada endpoint for criado. |

**Estratégia de microserviços (a definir):**
- Por ora, todos os módulos vivem no mesmo processo (monolito modular).
- Quando for dividir, candidatos naturais são: `auth+users`, `catalog` (institutions+canteens+categories+products+extras), `orders` (cart+orders+ratings), `notifications`. Mas isso será discutido formalmente antes de qualquer split.
- O DDD **garante** que a divisão futura não exija reescrita: cada módulo já comunica via interfaces (Repository/Symbol tokens), nunca por acesso direto.

---

## 3. Stack

| Tecnologia | Uso |
|---|---|
| **NestJS 11** | Framework HTTP |
| **TypeScript ES2023** | Linguagem |
| **PostgreSQL 17** | Banco de dados relacional |
| **Drizzle ORM** | ORM e migrations |
| **MinIO** | Armazenamento de objetos (imagens) |
| **Nodemailer** | Envio de e-mail SMTP |
| **JWT + Passport + bcryptjs** | Autenticação |
| **class-validator / class-transformer** | Validação de DTOs |
| **Swagger / OpenAPI** | Documentação da API |
| **Docker Compose** | PostgreSQL + MinIO no ambiente de dev |

---

## 4. Arquitetura

**Padrão atual: Clean Architecture + DDD em Modular Monolith.**

Cada feature é um módulo independente (bounded context) com 3 camadas:

```
src/modules/<modulo>/
├── domain/                    ← regras de negócio (sem framework)
│   ├── models/                ← entidades com restore() + withX()
│   └── repositories/          ← interfaces + Symbol tokens
├── application/               ← casos de uso
│   ├── services/              ← orquestram domain + repositories
│   └── dto/                   ← objetos de transferência
└── infra/                     ← acoplamento com framework/banco
    ├── controllers/           ← endpoints HTTP
    ├── repositories/          ← implementações Drizzle
    └── schemas/               ← tabelas Drizzle
```

**Regras invioláveis:**
- `domain` não importa de `application` nem `infra`.
- `application` não importa de `infra`.
- `controllers` não têm lógica de negócio — só delegam para o service.
- Repositórios são abstrações no domínio; implementação é injetada via Symbol token (DIP).

Detalhes completos: [docs/arquitetura.md](docs/arquitetura.md).

### Estrutura compartilhada

```
src/shared/
├── shared.module.ts
├── domain/
│   └── enums/                 ← UserRole, etc.
├── application/
│   └── dto/                   ← PaginatedResult
└── infra/
    ├── config/                ← env.validation.ts
    ├── database/              ← DrizzleService + seeds
    ├── decorators/            ← @Public, @Roles, @CurrentUser, @ResponseMessage
    ├── email/                 ← EmailService + templates
    ├── filters/               ← GlobalExceptionFilter
    ├── guards/                ← JwtAuthGuard, RolesGuard
    ├── interceptors/          ← TransformInterceptor
    ├── repositories/          ← ErrorLogRepository
    ├── schemas/               ← error_log
    ├── storage/               ← MinioService
    └── swagger/               ← ApiWrappedResponse
```

### Módulos atuais

| Módulo | Estado | Responsabilidade |
|---|---|---|
| `auth` | ✅ | Login, registro, recuperação de senha, JWT |
| `users` | ✅ | Entidade/repositório de usuários (sem controller próprio) |
| `location` | ✅ | Estados e cidades (públicos) |
| `institutions` | ✅ | CRUD ADMIN + validação pública de access_code |
| `canteens` | ❌ | Pendente |
| `categories` | ❌ | Pendente |
| `products` / `extras` | ❌ | Pendente |
| `cart` / `orders` / `ratings` | ❌ | Pendente |
| `reports` / `notifications` | ❌ | Pendente |

Backlog completo e ordem de execução: [docs/backlog-backend.md](docs/backlog-backend.md).

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
