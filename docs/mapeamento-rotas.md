# Mapeamento de Rotas — Ligeirinho Food Backend

> Documento gerado a partir da leitura dos controllers e DTOs de cada microserviço.
> Mapeia **todas** as rotas HTTP expostas, com autenticação, payload de entrada, response e HATEOAS.

---

## Sumário

- [1. Topologia e roteamento (Gateway)](#1-topologia-e-roteamento-gateway)
- [2. Convenções globais](#2-convenções-globais)
- [3. Identity (`:4001`)](#3-identity-4001)
  - [Auth](#auth--controllerauth)
  - [Me (perfil próprio)](#me-perfil-próprio--controllerme)
  - [Users (admin)](#users-admin--controllerusers)
  - [Location (states / cities)](#location--controllerstates--controllercities)
  - [Institutions](#institutions--controllerinstitutions)
- [4. Catalog (`:4002`)](#4-catalog-4002)
  - [Canteens](#canteens--controllercanteens)
  - [Categories](#categories--controllercategories)
  - [Products](#products--controllerproducts)
  - [Extras](#extras--paths-mistos)
  - [Icons](#icons--controllericons)
- [5. Orders (`:4003`)](#5-orders-4003)
  - [Cart](#cart--controllercart)
  - [Orders](#orders--controllerorders)
  - [Ratings](#ratings--controllercanteens)
  - [Reports](#reports--controllerreports)
  - [Payment Methods](#payment-methods--controllerpayment-methods)
- [6. Máquina de estados do pedido](#6-máquina-de-estados-do-pedido)
- [7. Tabela-resumo de todas as rotas](#7-tabela-resumo-de-todas-as-rotas)

---

## 1. Topologia e roteamento (Gateway)

O **gateway** (`:4000`, Express + `http-proxy-middleware`) é a única base URL exposta ao frontend. Ele resolve o serviço de destino **pelo prefixo do path** e encaminha a requisição intacta.

```
Frontend ── http://gateway:4000 ──┬── /auth /users /me /institutions /states /cities  → identity (:4001)
                                  ├── /canteens /categories /products /extras /icons   → catalog  (:4002)
                                  └── /cart /orders /ratings /reports /payment-methods  → orders   (:4003)
```

**Detalhes do roteamento** (`services/gateway/src/main.ts`):

- **Roteamento por prefixo de recurso** — o frontend usa uma única URL base; o dispatcher escolhe o serviço pelo path (`resolveService`).
- **Acesso namespaced** — `/<serviço>/*` (ex.: `/identity/...`, `/catalog/...`, `/orders/...`) encaminha bruto para o serviço, principalmente para expor o `/docs` de cada um.
- **Swagger agregado**: `/identity/docs`, `/catalog/docs`, `/orders/docs`.
- **Override de roteamento**: `GET /canteens/:id/ratings` e `/canteens/:id/rating` pertencem ao **orders** (avaliações), apesar do prefixo `/canteens` ser do catalog. Regra explícita: `^/canteens/[^/]+/ratings?$ → orders`.
- **Índice** `GET /` retorna o catálogo de serviços/prefixos no envelope padrão.

> Os paths neste documento são os **paths do serviço** (sem prefixo global — nenhum serviço usa `setGlobalPrefix`). Via gateway por prefixo de recurso, são idênticos; via namespace, prefixe com `/identity`, `/catalog` ou `/orders`.

---

## 2. Convenções globais

### Envelope de resposta
Toda resposta passa pelo `TransformInterceptor`:

```json
{
  "data": { },
  "status": { "code": 200, "message": "Mensagem amigável" },
  "pagination": { "page": 1, "perPage": 10, "hasNextPage": true }
}
```

- `@ResponseMessage("...")` define `status.message`.
- `@ApiWrappedResponse(Dto, { isArray, description })` documenta o `data` no Swagger. Endpoints **sem** esse decorator não têm o shape do `data` documentado (retornam `null` ou objetos inline).
- `pagination` só aparece em listagens paginadas (`PaginatedResult`, padrão `limit+1`).

### Autenticação e autorização
- **JWT global por padrão**: toda rota exige `Authorization: Bearer <token>` salvo se decorada com `@Public()`.
  - `identity` usa `JwtAuthGuard` (Passport, **com lookup no DB** a cada request — invalida ban/role-change na hora).
  - `catalog` e `orders` usam `StatelessJwtAuthGuard` (verificam só a **assinatura** do JWT; claims em `AuthenticatedUser`: `userId/sub`, `role`, `institutionId`, `canteenId`).
- `@Roles(...)` restringe por papel (`ADMIN`, `INSTITUTION_ADMIN`, `SELLER`, `CUSTOMER`). Sem `@Roles` → qualquer autenticado.
- `@CurrentUser()` injeta o usuário/claims do token.

### Validação
`ValidationPipe` global com `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true` — **campos não declarados no DTO são rejeitados** (400).

### Status HTTP
Nenhum controller usa `@HttpCode`. Vale o default do Nest: **201** para `POST`, **200** para `GET/PUT/PATCH/DELETE`.

### Erros
Exceções Nest (`NotFoundException`, `ConflictException`, etc.) → formatadas no envelope pelo `GlobalExceptionFilter` e persistidas em `error_logs`.

### Login / token
`POST /auth/login` e `POST /auth/register` retornam `AuthResponseDto`: `{ accessToken: string, user: UserDto }`. Use o `accessToken` no header `Authorization`.

---

## 3. Identity (`:4001`)

DB: `ligeirinho_identity`. Módulos: auth, users, location, institutions.

### Auth — `@Controller("auth")`
Todas as rotas são **`@Public()`** (sem JWT).

| # | Método / Path | Rate limit | Body | Response | Mensagem |
|---|---|---|---|---|---|
| 1 | `POST /auth/register` | — | `RegisterDto` | `AuthResponseDto` | Usuário registrado com sucesso |
| 2 | `POST /auth/login` | 5/min | `LoginDto` | `AuthResponseDto` | Login efetuado com sucesso |
| 3 | `POST /auth/forgot-password` | 3/10min | `ForgotPasswordDto` | — | Solicitação processada |
| 4 | `POST /auth/verify-code` | — | `VerifyCodeDto` | — | Código verificado |
| 5 | `POST /auth/reset-password` | — | `ResetPasswordDto` | — | Senha redefinida com sucesso |
| 6 | `POST /auth/reactivation/request` | 3/10min | `ReactivationRequestDto` | — | Solicitação processada |
| 7 | `POST /auth/reactivation/confirm` | — | `ReactivationConfirmDto` | `AuthResponseDto` | Conta reativada com sucesso |

**DTOs de entrada:**

- **`RegisterDto`** — `fullName` (string, ≥3), `email` (email), `password` (string, ≥6), `phoneNumber?` (string), `accessCode` (string, exatamente 6 dígitos `^\d{6}$`).
  > Registro público é **restrito a CUSTOMER** e exige `accessCode` de instituição válida.
- **`LoginDto`** — `email` (email), `password` (string, ≥6).
- **`ForgotPasswordDto`** — `email` (email).
- **`VerifyCodeDto`** — `email` (email), `code` (6 dígitos `^\d{6}$`).
- **`ResetPasswordDto`** — `email` (email), `code` (6 dígitos), `newPassword` (string, ≥6).
- **`ReactivationRequestDto`** — `email` (email).
- **`ReactivationConfirmDto`** — `email` (email), `code` (string, length 6).

---

### Me (perfil próprio) — `@Controller("me")`
JWT obrigatório (qualquer role autenticada). Opera sobre o próprio usuário (`@CurrentUser`).

| # | Método / Path | Body | Response | Mensagem |
|---|---|---|---|---|
| 8 | `GET /me` | — | `UserDto` | Perfil carregado |
| 9 | `PATCH /me` | `UpdateUserDto` | `UserDto` | Perfil atualizado |
| 10 | `DELETE /me` | — | `null` | Conta desativada (soft delete) |
| 11 | `POST /me/migrate-institution` | `MigrateInstitutionDto` | `UserDto` | Instituição alterada com sucesso |

- **`UpdateUserDto`** — `fullName?` (≤100), `phoneNumber?` (≤20), `profilePhotoUrl?` (string).
- **`MigrateInstitutionDto`** — `accessCode` (string, length 6). Valida novo código e troca `institution_id` (CUSTOMER migra de instituição).

---

### Users (admin) — `@Controller("users")`
JWT + `@Roles`. Cria/gerencia ADMIN e INSTITUTION_ADMIN.

| # | Método / Path | Roles | Body / Params | Response | Mensagem |
|---|---|---|---|---|---|
| 12 | `GET /users` | ADMIN, INSTITUTION_ADMIN | query: `page`, `perPage`, `search?`, `role?`, `institutionId?`, `onlyActive?`(default true) | `UserDto[]` paginado | Usuários listados |
| 13 | `POST /users` | ADMIN | `CreateUserDto` | `UserDto` | Usuário criado com sucesso |
| 14 | `PATCH /users/:id` | ADMIN, INSTITUTION_ADMIN | `UpdateUserDto` | `UserDto` | Usuário atualizado |
| 15 | `PATCH /users/:id/role` | ADMIN | `ChangeRoleDto` | `UserDto` | Role atualizado |
| 16 | `DELETE /users/:id` | ADMIN, INSTITUTION_ADMIN | param `id` (UUID) | `null` | Usuário desativado (soft delete) |
| 17 | `POST /users/:id/force-reset-password` | ADMIN, INSTITUTION_ADMIN | param `id` (UUID) | — | Código de recuperação enviado |

- **`CreateUserDto`** — `fullName` (≤100, obrigatório), `email`, `password` (≥6), `role` (**apenas** ADMIN ou INSTITUTION_ADMIN), `institutionId?` (UUID).
- **`ChangeRoleDto`** — `role` (qualquer valor do enum `UserRole`).

**`UserDto`** (response): `id`, `fullName`, `email`, `phoneNumber|null`, `profilePhotoUrl|null`, `role`, `institutionId|null`, `canteenId|null`.

---

### Location — `@Controller("states")` / `@Controller("cities")`
Ambas **`@Public()`**.

| # | Método / Path | Param | Response | Mensagem |
|---|---|---|---|---|
| 18 | `GET /states` | — | `StateDto[]` | Estados listados com sucesso |
| 19 | `GET /cities/:stateId` | `stateId` (int, IBGE) | `CityDto[]` | Cidades listadas com sucesso |

- **`StateDto`** — `id` (cód. IBGE), `name`, `abbreviation` (sigla UF).
- **`CityDto`** — `id` (IBGE município), `name`, `stateId`.

---

### Institutions — `@Controller("institutions")`
Quase tudo **ADMIN-only**; duas exceções públicas.

| # | Método / Path | Auth | Body / Params | Response | Mensagem |
|---|---|---|---|---|---|
| 20 | `POST /institutions` | ADMIN | `multipart/form-data`: `CreateInstitutionDto` + `photo?` | `InstitutionResponseDto` | Instituição criada com sucesso |
| 21 | `GET /institutions` | ADMIN | query: `page`, `perPage`, `search?`, `stateId?`, `cityId?`, `sortBy?` | `InstitutionResponseDto[]` paginado | Instituições listadas com sucesso |
| 22 | `GET /institutions/count` | ADMIN | — | `{ ...count }` | Contagem de instituições |
| 23 | `GET /institutions/validate/:accessCode` | **Public** | `accessCode` (6 dígitos `^\d{6}$`) | `InstitutionValidateResponseDto` | Código de acesso válido |
| 24 | `GET /institutions/:id` | ADMIN | `id` (UUID) | `InstitutionResponseDto` | Instituição encontrada |
| 25 | `PUT /institutions/:id` | ADMIN | `multipart/form-data`: `UpdateInstitutionDto` + `photo?` | `InstitutionResponseDto` | Instituição atualizada com sucesso |
| 26 | `DELETE /institutions/:id` | ADMIN | `id` (UUID) | `null` | Instituição removida com sucesso |

- **`CreateInstitutionDto`** — `name` (≤150), `stateId` (int ≥1), `cityId` (int ≥1), `photo?` (arquivo binário). Obrigatórios: name, stateId, cityId.
- **`UpdateInstitutionDto`** — todos opcionais: `name?`, `stateId?`, `cityId?`, `photo?`.
- **`InstitutionResponseDto`** — `id`, `name`, `photoUrl|null`, `accessCode`, `stateId`, `stateName|null`, `cityId`, `cityName|null`, `createdAt`.
- **`InstitutionValidateResponseDto`** — `id`, `name` (usado no fluxo de registro do CUSTOMER).

**HATEOAS:**
- `GET /institutions` (`@HateoasList`): por item → `self` (GET :id), `update` (PUT :id), `delete` (DELETE :id).
- `GET /institutions/:id` (`@HateoasItem`): `self`, `update`, `delete`, `canteens` (`GET /canteens?institutionId=:id`).

---

## 4. Catalog (`:4002`)

DB: `ligeirinho_catalog`. Módulos: canteens, categories, products, extras. Auth **stateless** (assinatura do JWT). Imagens no MinIO.

### Canteens — `@Controller("canteens")`

| # | Método / Path | Auth | Body / Params / Query | Response | Mensagem |
|---|---|---|---|---|---|
| 1 | `POST /canteens` | ADMIN, INSTITUTION_ADMIN | `CreateCanteenDto` | `CanteenResponseDto` | Cantina criada com sucesso |
| 2 | `GET /canteens` | qualquer JWT | query: `page`, `perPage`, `institutionId?`, `search?` | `CanteenResponseDto[]` paginado | Cantinas listadas com sucesso |
| 3 | `GET /canteens/count` | ADMIN | query: `institutionId?` | `{ total }` | Contagem de cantinas |
| 4 | `GET /canteens/me` | SELLER | — (usa `canteenId` do JWT) | `CanteenResponseDto` | Cantina encontrada |
| 5 | `PATCH /canteens/me` | SELLER | `UpdateCanteenDto` | `CanteenResponseDto` | Cantina atualizada com sucesso |
| 6 | `GET /canteens/:id` | qualquer JWT | `id` (UUID) | `CanteenResponseDto` | Cantina encontrada |
| 7 | `PUT /canteens/:id` | ADMIN, INSTITUTION_ADMIN, SELLER | `id` (UUID) + `UpdateCanteenDto` | `CanteenResponseDto` | Cantina atualizada com sucesso |
| 8 | `DELETE /canteens/:id` | ADMIN, INSTITUTION_ADMIN | `id` (UUID) | `null` | Cantina removida com sucesso |
| 9 | `PATCH /canteens/:id/toggle-open` | SELLER | `id` (UUID) | `CanteenResponseDto` | Status da cantina atualizado |
| 10 | `POST /canteens/:id/logo` | ADMIN, INSTITUTION_ADMIN, SELLER | `multipart/form-data`: campo `logo` | `CanteenResponseDto` | Logo atualizada com sucesso |

- **`CreateCanteenDto`** — `name` (≤150), `institutionId` (UUID), `cnpj?` (≤18), `block?` (≤50), `room?` (≤50), `sellerName` (≤100), `sellerEmail` (email), `sellerPassword` (≥6).
  > Criar cantina cria **atomicamente o SELLER vinculado** (1:1) e publica `canteen.created`. INSTITUTION_ADMIN só cria na própria instituição.
- **`UpdateCanteenDto`** — todos opcionais: `name?`, `cnpj?`, `block?`, `room?`.
- **`CanteenResponseDto`** — `id`, `institutionId`, `sellerId|null`, `name`, `cnpj|null`, `block|null`, `room|null`, `logoUrl|null`, `isOpen`, `createdAt`.

**HATEOAS:**
- `GET /canteens` (`@HateoasList`): por item → `self` (GET :id), `products` (`GET /products?canteenId=:id`).
- `GET /canteens/:id` (`@HateoasItem`): `self`, `update` (PUT :id), `delete` (DELETE :id), `products`.

---

### Categories — `@Controller("categories")`
Categorias são **globais** (não pertencem a cantina). Escrita ADMIN-only.

| # | Método / Path | Auth | Body / Params | Response | Mensagem |
|---|---|---|---|---|---|
| 1 | `POST /categories` | ADMIN | `CreateCategoryDto` | `CategoryResponseDto` | Categoria criada com sucesso |
| 2 | `GET /categories` | **Public** | — | `CategoryResponseDto[]` (não paginado) | Categorias listadas com sucesso |
| 3 | `PUT /categories/:id` | ADMIN | `id` (UUID) + `UpdateCategoryDto` | `CategoryResponseDto` | Categoria atualizada com sucesso |
| 4 | `DELETE /categories/:id` | ADMIN | `id` (UUID) | `null` | Categoria removida com sucesso |

- **`CreateCategoryDto`** — `name` (≤100), `iconKey?` (≤50), `displayOrder?` (int ≥0).
- **`UpdateCategoryDto`** — todos opcionais.
- **`CategoryResponseDto`** — `id`, `name`, `iconKey|null`, **`iconUrl|null`**, `displayOrder`.
  > `DELETE` bloqueia se houver produtos na categoria.
  > **`iconKey` validado** contra `/icons`: quando enviado (create/update), deve referenciar um ícone existente — senão **400**. `iconUrl` é resolvido a partir do `iconKey` (URL do ícone no MinIO; `null` se sem ícone), pro app exibir a categoria sem um segundo request.

---

### Products — `@Controller("products")`
Leitura **pública**; escrita **SELLER-only**.

| # | Método / Path | Auth | Body / Params / Query | Response | Mensagem |
|---|---|---|---|---|---|
| 1 | `POST /products` | SELLER | `CreateProductDto` | `ProductResponseDto` | Produto criado com sucesso |
| 2 | `GET /products/featured` | **Public** | query: `institutionId?`, `limit?`(10) | `ProductResponseDto[]` | Destaques listados |
| 3 | `GET /products` | **Public** | query: `canteenId`, `page`, `perPage`, `categoryId?`, `search?`, `onlyActive?`(true) | `ProductResponseDto[]` paginado | Produtos listados com sucesso |
| 4 | `GET /products/:id` | **Public** | `id` (UUID) | `ProductResponseDto` | Produto encontrado |
| 5 | `PUT /products/:id` | SELLER | `id` (UUID) + `UpdateProductDto` | `ProductResponseDto` | Produto atualizado com sucesso |
| 6 | `DELETE /products/:id` | SELLER | `id` (UUID) | `null` | Produto removido com sucesso (soft delete) |
| 7 | `POST /products/:id/photo` | SELLER | `multipart/form-data`: campo `photo` | `ProductResponseDto` | Foto atualizada com sucesso |
| 8 | `PATCH /products/:id/feature` | SELLER | `id` (UUID) | `ProductResponseDto` | Produto marcado como destaque |
| 9 | `PATCH /products/:id/unfeature` | SELLER | `id` (UUID) | `ProductResponseDto` | Destaque removido |

- **`CreateProductDto`** — `canteenId` (UUID), `categoryId` (UUID), `name` (≤200), `description?` (string), `price` (string numérica, ex. `"15.90"`).
- **`UpdateProductDto`** — todos opcionais: `categoryId?`, `name?`, `description?`, `price?`, `isActive?`.
- **`ProductResponseDto`** — `id`, `canteenId`, `categoryId`, `name`, `description|null`, `price` (string), `photoUrl|null`, `isActive`, `isFeatured`, `createdAt`.
  > Preço trafega como **string** (`@IsNumberString`) na entrada e na resposta. Mudanças publicam `product.upserted`/`product.deleted` (projeção no orders).

**HATEOAS:**
- `GET /products` (`@HateoasList`): por item → `self` (GET :id).
- `GET /products/:id` (`@HateoasItem`): `self`, `update` (PUT :id), `delete` (DELETE :id), `extras` (`GET /products/:id/extras`).

---

### Extras — paths mistos
Controller **sem prefixo** (`@Controller()`); paths definidos por método. Mistura adicionais (`/extras`) e recursos do produto (`/products/:productId/...`). Escrita SELLER-only; leitura pública.

| # | Método / Path | Auth | Body / Params / Query | Response | Mensagem |
|---|---|---|---|---|---|
| 1 | `POST /extras` | SELLER | `CreateExtraDto` | `ExtraResponseDto` | Adicional criado com sucesso |
| 2 | `GET /extras` | **Public** | query: `canteenId`, `page`, `perPage` | `ExtraResponseDto[]` paginado | Adicionais listados |
| 3 | `PUT /extras/:id` | SELLER | `id` (UUID) + `UpdateExtraDto` | `ExtraResponseDto` | Adicional atualizado |
| 4 | `DELETE /extras/:id` | SELLER | `id` (UUID) | `null` | Adicional removido (soft delete) |
| 5 | `POST /products/:productId/extras` | SELLER | `AddExtrasToProductDto` | `null` | Extras vinculados |
| 6 | `DELETE /products/:productId/extras/:extraId` | SELLER | params (UUID) | `null` | Vínculo removido |
| 7 | `GET /products/:productId/extras` | **Public** | `productId` (UUID) | `ExtraResponseDto[]` (ativos) | Extras do produto |
| 8 | `POST /products/:productId/removable-ingredients` | SELLER | `SetRemovableIngredientsDto` | `{ id, name }[]` | Ingredientes atualizados |
| 9 | `GET /products/:productId/removable-ingredients` | **Public** | `productId` (UUID) | `{ id, name }[]` | Ingredientes removíveis |

- **`CreateExtraDto`** — `canteenId` (UUID), `name` (≤150), `price` (string numérica).
- **`UpdateExtraDto`** — opcionais: `name?`, `price?`, `isActive?`.
- **`AddExtrasToProductDto`** — `extraIds` (string[], cada UUID v4). Vínculo N:N produto↔extra.
- **`SetRemovableIngredientsDto`** — `names` (string[]). Substitui o conjunto em batch.
- **`ExtraResponseDto`** — `id`, `canteenId`, `name`, `price` (string), `isActive`.

---

### Icons — `@Controller("icons")`
Biblioteca **global** de ícones gerenciada pelo ADMIN; referenciada por categorias via `iconKey` (futuramente também por métodos de pagamento). Escrita ADMIN-only; leitura **pública**. Imagem no MinIO.

| # | Método / Path | Auth | Body / Params / Query | Response | Mensagem |
|---|---|---|---|---|---|
| 1 | `POST /icons` | ADMIN | `multipart/form-data`: `CreateIconDto` + `file` (SVG/PNG) | `IconResponseDto` | Ícone criado com sucesso |
| 2 | `GET /icons` | **Public** | query: `tag?`, `search?` | `IconResponseDto[]` | Ícones listados com sucesso |
| 3 | `GET /icons/:id` | **Public** | `id` (UUID) | `IconResponseDto` | Ícone encontrado |
| 4 | `PUT /icons/:id` | ADMIN | `id` (UUID) + `multipart/form-data`: `UpdateIconDto` + `file?` | `IconResponseDto` | Ícone atualizado com sucesso |
| 5 | `DELETE /icons/:id` | ADMIN | `id` (UUID) | `null` | Ícone removido com sucesso |

- **`CreateIconDto`** — `key` (slug único `^[a-z0-9-]+$`, ≤50, **imutável após criação**), `name` (≤100), `tag?` (≤50), `file` (arquivo binário SVG/PNG, **obrigatório**).
- **`UpdateIconDto`** — `name?`, `tag?`, `file?` (a `key` **não** muda).
- **`IconResponseDto`** — `id`, `key`, `name`, `url` (MinIO), `tag|null`, `createdAt`.
  > Criar com `key` já existente → **409**. `DELETE` bloqueia com **409** se a `key` estiver em uso por alguma categoria (hard delete + guarda, espelha categorias).

**HATEOAS:**
- `GET /icons` (`@HateoasList`): por item → `self` (GET :id), `update` (PUT :id), `delete` (DELETE :id).
- `GET /icons/:id` (`@HateoasItem`): `self`, `update`, `delete`.

---

## 5. Orders (`:4003`)

DB: `ligeirinho_orders`. Módulos: cart, orders, ratings, reports. Mantém projeções read-only `products_view` e `canteens_view` (alimentadas por eventos do catalog).

### Cart — `@Controller("cart")`
**Todas** as rotas: JWT + `CUSTOMER`.

| # | Método / Path | Body / Params | Response | Mensagem |
|---|---|---|---|---|
| 1 | `POST /cart/items` | `AddCartItemDto` | `null` | Item adicionado ao carrinho |
| 2 | `GET /cart` | — | `CartItem[]` | Carrinho carregado |
| 3 | `PATCH /cart/items/:id` | `id` (UUID) + `UpdateCartItemDto` | `null` | Quantidade atualizada |
| 4 | `DELETE /cart/items/:id` | `id` (UUID) | `null` | Item removido |
| 5 | `DELETE /cart` | — | `null` | Carrinho esvaziado |

- **`AddCartItemDto`** — `productId` (UUID), `quantity` (int ≥1), `note?` (string), `extraIds?` (string[] UUID v4).
- **`UpdateCartItemDto`** — `quantity` (int ≥1).
- **`CartItem`** (response): `id`, `productId`, `productName`, `productPrice` (string), `canteenId`, `quantity`, `note|null`, `extras: { id, name, price }[]`.
  > Regras: produto deve existir na projeção `products_view` (404) e estar disponível (409); o carrinho aceita itens de **uma única cantina** por vez (409 ao misturar).

**HATEOAS:** `GET /cart` (`@HateoasList`): por item → `self` (`PATCH /cart/items/:id`), `remove` (`DELETE /cart/items/:id`).

---

### Orders — `@Controller("orders")`

| # | Método / Path | Auth | Body / Params / Query | Response | Mensagem |
|---|---|---|---|---|---|
| 1 | `POST /orders` | CUSTOMER | `CreateOrderDto` (do carrinho + body) | `OrderResponseDto` | Pedido criado com sucesso |
| 2 | `GET /orders/me` | CUSTOMER | query: `status`(open/history), `page`, `perPage` | `OrderResponseDto[]` paginado | Pedidos listados |
| 3 | `GET /orders/canteen` | SELLER | query: `status`(CSV), `page`, `perPage` | `OrderResponseDto[]` paginado | Pedidos da cantina listados |
| 4 | `GET /orders/:id` | qualquer JWT ⚠️ | `id` (UUID) | `OrderResponseDto` | Pedido encontrado |
| 5 | `PATCH /orders/:id/advance` | SELLER | `id` (UUID) | `OrderResponseDto` | Status avançado |
| 6 | `PATCH /orders/:id/pickup` | CUSTOMER | `id` (UUID) | `OrderResponseDto` | Retirada confirmada |
| 7 | `PATCH /orders/:id/cancel` | CUSTOMER ou SELLER | `id` (UUID) + `CancelOrderDto` | `OrderResponseDto` | Pedido cancelado |
| 8 | `PATCH /orders/:id/rating` | CUSTOMER | `id` (UUID) + `RateOrderDto` | `null` | Avaliação registrada |

- **`CreateOrderDto`** — `paymentMethodId` (UUID, **obrigatório**). Deve existir (**404**) e estar ativo (**409**).
- **`CancelOrderDto`** — `reason?` (string).
- **`RateOrderDto`** — `rating` (int 1–5), `comment?` (string).
- **`OrderResponseDto`** — `id`, `userId`, `canteenId`, `status`, `total` (string), **`paymentMethodId`**, **`paymentMethodNameSnapshot`**, **`paymentMethodType`**, `rating|null`, `ratingComment|null`, `cancelReason|null`, `createdAt`, `updatedAt`, `items: OrderItemDto[]`.
- **`OrderItemDto`** — `id`, `productId`, `productNameSnapshot`, `unitPriceAtPurchase` (string), `quantity`, `note|null`, `extras: { extraId, extraNameSnapshot, unitPriceAtPurchase }[]`.

**Regras-chave:**
- `POST /orders`: exige `paymentMethodId` (404 se inexistente / 409 se inativo); carrinho não vazio (409) e cantina aberta (409); calcula `total`, grava **snapshots** de nome/preço **e da forma de pagamento** (id + nome + tipo), limpa o carrinho, publica `order.created` (→ e-mail no identity).
- `advance`: SELLER só avança pedido da própria cantina (403); 409 se não há próximo status; publica `order.status_changed`.
- `pickup`: só o dono (403); status deve ser `AGUARDANDO_RETIRADA` (409) → `RETIRADO`.
- `cancel`: CUSTOMER só cancela o próprio e **apenas** em `AGUARDANDO`; SELLER só da própria cantina; 409 se status não cancelável.
- `rating`: só o dono (403); status `RETIRADO` (409); não pode reavaliar (409).
- ⚠️ **`GET /orders/:id` não tem `@Roles` e o service não valida ownership** — qualquer autenticado pode ler qualquer pedido. Candidato a revisão de segurança.

**HATEOAS** (`orderLinks`, dinâmico por status):
- `self` → `GET /orders/:id` (sempre)
- `advance` → `PATCH /orders/:id/advance` (se há próximo status)
- `cancel` → `PATCH /orders/:id/cancel` (se cancelável)
- `pickup` → `PATCH /orders/:id/pickup` (se `AGUARDANDO_RETIRADA`)
- `rate` → `PATCH /orders/:id/rating` (se `RETIRADO`)

---

### Ratings — `@Controller("canteens")`
⚠️ Prefixo `/canteens` mas pertence ao **orders** (roteado via override no gateway). Ambas **`@Public()`**.

| # | Método / Path | Params / Query | Response | Mensagem |
|---|---|---|---|---|
| 1 | `GET /canteens/:id/ratings` | `id` cantina (UUID) + query `page`, `perPage` | paginado: `{ rating, comment|null, customerName, createdAt }` | Avaliações listadas |
| 2 | `GET /canteens/:id/rating` | `id` cantina (UUID) | `{ average, count }` | Média calculada |

> Avaliações derivam de pedidos com `rating IS NOT NULL` daquela cantina (ordenado por `updatedAt` desc). `average` = 0 quando não há avaliações.

---

### Reports — `@Controller("reports")`
JWT obrigatório. Sem body; tudo via query. Se `canteenId` não vier, usa `canteenId` do JWT (caso SELLER). Métricas consideram apenas pedidos `RETIRADO`.

| # | Método / Path | Roles | Query | Response | Mensagem |
|---|---|---|---|---|---|
| 1 | `GET /reports/revenue` | SELLER, ADMIN | `canteenId?`, `from?`, `to?` | `{ current, previous, deltaPercent }` | Receita calculada |
| 2 | `GET /reports/orders-count` | SELLER, ADMIN | `canteenId?`, `from?`, `to?` | `{ current, previous, deltaPercent }` | Contagem calculada |
| 3 | `GET /reports/revenue-trend` | SELLER, ADMIN | `canteenId?` | `{ date, total }[]` (7 dias) | Tendência calculada |
| 4 | `GET /reports/top-products` | SELLER, ADMIN | `canteenId?`, `limit?`(5), `days?`(30) | `{ productId, name, quantity, revenue }[]` | Top produtos calculados |
| 5 | `GET /reports/admin-counts` | ADMIN | — | `{ institutions, canteens }` | Contagens retornadas |

> `revenue` e `orders-count`: período default = últimos 30 dias; `previous` = janela anterior de mesmo tamanho; `deltaPercent` compara as duas. `admin-counts` usa a projeção `canteens_view`.

---

### Payment Methods — `@Controller("payment-methods")`
Catálogo **global** de formas de pagamento gerenciado pelo ADMIN. O app lista as ativas no checkout; o pedido guarda a forma escolhida (snapshot). Escrita ADMIN-only; leitura por qualquer JWT.

| # | Método / Path | Auth | Body / Params / Query | Response | Mensagem |
|---|---|---|---|---|---|
| 1 | `POST /payment-methods` | ADMIN | `CreatePaymentMethodDto` | `PaymentMethodResponseDto` | Método de pagamento criado com sucesso |
| 2 | `GET /payment-methods` | qualquer JWT | query: `onlyActive?` (default `false`) | `PaymentMethodResponseDto[]` | Métodos de pagamento listados |
| 3 | `GET /payment-methods/:id` | qualquer JWT | `id` (UUID) | `PaymentMethodResponseDto` | Método encontrado |
| 4 | `PUT /payment-methods/:id` | ADMIN | `id` (UUID) + `UpdatePaymentMethodDto` | `PaymentMethodResponseDto` | Método atualizado com sucesso |
| 5 | `PATCH /payment-methods/:id/toggle` | ADMIN | `id` (UUID) | `PaymentMethodResponseDto` | Status do método atualizado |
| 6 | `DELETE /payment-methods/:id` | ADMIN | `id` (UUID) | `null` | Método removido com sucesso |

- **`CreatePaymentMethodDto`** — `name` (≤100), `description?` (≤255), `type` (enum `PaymentMethodType`: `PIX`, `CREDIT_CARD`, `DEBIT_CARD`, `CASH`, `DIGITAL_WALLET`), `iconKey?` (≤50), `displayOrder?` (int ≥0, default 0), `isActive?` (boolean, default `true`).
- **`UpdatePaymentMethodDto`** — todos opcionais.
- **`PaymentMethodResponseDto`** — `id`, `name`, `description|null`, `type`, `iconKey|null`, `isActive`, `displayOrder`, `createdAt`.
  > `toggle` (5) atende o switch Ativo/Inativo sem reenviar o objeto. `DELETE` bloqueia com **409** se algum pedido referencia o método (hard delete + guarda); o caminho normal de "desativar" é `isActive=false`/`toggle`.

**HATEOAS:**
- `GET /payment-methods` (`@HateoasList`): por item → `self` (GET :id), `update` (PUT :id), `delete` (DELETE :id), `toggle` (PATCH :id/toggle).
- `GET /payment-methods/:id` (`@HateoasItem`): `self`, `update`, `delete`, `toggle`.

---

## 6. Máquina de estados do pedido

Enum `OrderStatus`: `AGUARDANDO`, `EM_PREPARO`, `PRONTO`, `AGUARDANDO_RETIRADA`, `RETIRADO`, `CANCELADO`.

```
AGUARDANDO ──advance──> EM_PREPARO ──advance──> PRONTO ──advance──> AGUARDANDO_RETIRADA ──pickup──> RETIRADO ──> (rating)
     │                      │                     │                                                   
     └────────┬─────────────┴─────────────────────┘                                                   
              ▼ cancel                                                                                 
          CANCELADO (terminal)
```

- **Avanço pelo SELLER** (`PATCH /:id/advance`): `AGUARDANDO → EM_PREPARO → PRONTO → AGUARDANDO_RETIRADA`.
- **Confirmação pelo CUSTOMER** (`PATCH /:id/pickup`): `AGUARDANDO_RETIRADA → RETIRADO` (este passo **não** é do SELLER).
- **Cancelamento** (`PATCH /:id/cancel`): permitido em `AGUARDANDO`, `EM_PREPARO`, `PRONTO`. CUSTOMER só em `AGUARDANDO`; SELLER nos três.
- **Avaliação** (`PATCH /:id/rating`): só após `RETIRADO`, uma única vez.
- Estados terminais: `RETIRADO`, `CANCELADO`.

---

## 7. Tabela-resumo de todas as rotas

> Total: **89 endpoints** (gateway não conta) — Identity **26** · Catalog **37** (canteens 10 · categories 4 · products 9 · extras 9 · **icons 5**) · Orders **26** (cart 5 · orders 8 · ratings 2 · reports 5 · **payment-methods 6**).

### Identity (26)
| Método | Path | Auth |
|---|---|---|
| POST | /auth/register | Public |
| POST | /auth/login | Public |
| POST | /auth/forgot-password | Public |
| POST | /auth/verify-code | Public |
| POST | /auth/reset-password | Public |
| POST | /auth/reactivation/request | Public |
| POST | /auth/reactivation/confirm | Public |
| GET | /me | JWT |
| PATCH | /me | JWT |
| DELETE | /me | JWT |
| POST | /me/migrate-institution | JWT |
| GET | /users | ADMIN, INSTITUTION_ADMIN |
| POST | /users | ADMIN |
| PATCH | /users/:id | ADMIN, INSTITUTION_ADMIN |
| PATCH | /users/:id/role | ADMIN |
| DELETE | /users/:id | ADMIN, INSTITUTION_ADMIN |
| POST | /users/:id/force-reset-password | ADMIN, INSTITUTION_ADMIN |
| GET | /states | Public |
| GET | /cities/:stateId | Public |
| POST | /institutions | ADMIN |
| GET | /institutions | ADMIN |
| GET | /institutions/count | ADMIN |
| GET | /institutions/validate/:accessCode | Public |
| GET | /institutions/:id | ADMIN |
| PUT | /institutions/:id | ADMIN |
| DELETE | /institutions/:id | ADMIN |

### Catalog (28)
| Método | Path | Auth |
|---|---|---|
| POST | /canteens | ADMIN, INSTITUTION_ADMIN |
| GET | /canteens | JWT |
| GET | /canteens/count | ADMIN |
| GET | /canteens/me | SELLER |
| PATCH | /canteens/me | SELLER |
| GET | /canteens/:id | JWT |
| PUT | /canteens/:id | ADMIN, INSTITUTION_ADMIN, SELLER |
| DELETE | /canteens/:id | ADMIN, INSTITUTION_ADMIN |
| PATCH | /canteens/:id/toggle-open | SELLER |
| POST | /canteens/:id/logo | ADMIN, INSTITUTION_ADMIN, SELLER |
| POST | /categories | ADMIN |
| GET | /categories | Public |
| PUT | /categories/:id | ADMIN |
| DELETE | /categories/:id | ADMIN |
| POST | /products | SELLER |
| GET | /products/featured | Public |
| GET | /products | Public |
| GET | /products/:id | Public |
| PUT | /products/:id | SELLER |
| DELETE | /products/:id | SELLER |
| POST | /products/:id/photo | SELLER |
| PATCH | /products/:id/feature | SELLER |
| PATCH | /products/:id/unfeature | SELLER |
| POST | /icons | ADMIN |
| GET | /icons | Public |
| GET | /icons/:id | Public |
| PUT | /icons/:id | ADMIN |
| DELETE | /icons/:id | ADMIN |

### Catalog — Extras (9, controller sem prefixo)
| Método | Path | Auth |
|---|---|---|
| POST | /extras | SELLER |
| GET | /extras | Public |
| PUT | /extras/:id | SELLER |
| DELETE | /extras/:id | SELLER |
| POST | /products/:productId/extras | SELLER |
| DELETE | /products/:productId/extras/:extraId | SELLER |
| GET | /products/:productId/extras | Public |
| POST | /products/:productId/removable-ingredients | SELLER |
| GET | /products/:productId/removable-ingredients | Public |

### Orders (26)
| Método | Path | Auth |
|---|---|---|
| POST | /cart/items | CUSTOMER |
| GET | /cart | CUSTOMER |
| PATCH | /cart/items/:id | CUSTOMER |
| DELETE | /cart/items/:id | CUSTOMER |
| DELETE | /cart | CUSTOMER |
| POST | /orders | CUSTOMER |
| GET | /orders/me | CUSTOMER |
| GET | /orders/canteen | SELLER |
| GET | /orders/:id | JWT ⚠️ |
| PATCH | /orders/:id/advance | SELLER |
| PATCH | /orders/:id/pickup | CUSTOMER |
| PATCH | /orders/:id/cancel | CUSTOMER, SELLER |
| PATCH | /orders/:id/rating | CUSTOMER |
| GET | /canteens/:id/ratings | Public |
| GET | /canteens/:id/rating | Public |
| GET | /reports/revenue | SELLER, ADMIN |
| GET | /reports/orders-count | SELLER, ADMIN |
| GET | /reports/revenue-trend | SELLER, ADMIN |
| GET | /reports/top-products | SELLER, ADMIN |
| GET | /reports/admin-counts | ADMIN |
| POST | /payment-methods | ADMIN |
| GET | /payment-methods | JWT |
| GET | /payment-methods/:id | JWT |
| PUT | /payment-methods/:id | ADMIN |
| PATCH | /payment-methods/:id/toggle | ADMIN |
| DELETE | /payment-methods/:id | ADMIN |

---

### Achados a revisar
- **`GET /orders/:id`** não restringe role nem valida ownership — qualquer usuário autenticado lê qualquer pedido. Recomenda-se validar dono/cantina.
- Vários endpoints retornam `null`/objetos inline **sem `@ApiWrappedResponse`** (DELETEs, contadores, reports, cart writes) — Swagger não documenta o shape do `data`.
- Endpoints de **reports** não validam `from`/`to`/`canteenId` (sem pipes); datas inválidas viram `new Date(...)` sem checagem.
- `GET /categories` e `GET /products` (lista) — leitura pública por design; já `GET /canteens` exige JWT. Inconsistência intencional? Vale confirmar.
