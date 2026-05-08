# Backlog de Backend — Ligeirinho Food

Backlog único e canônico das tasks de backend. Definido em **2026-04-27**.

> ⚠️ **Importante — sobre regras de negócio**
>
> Os critérios de aceite e defaults sugeridos neste documento (ex.: status de pedido, soft delete, campos de schema, validações específicas) são **pontos de partida** e estão sujeitos a discussão durante a implementação de cada task.
>
> A regra de negócio definitiva é decidida **na conversa, na hora de implementar** — não engessada aqui. Este doc serve para enxergar o escopo e as dependências, não para fechar decisões antecipadamente.

**Legenda de status:**

- ✅ Concluída
- ⚠️ Parcial (algo já existe, mas falta refinamento)
- ❌ Pendente

**Convenções gerais (valem para todas as tasks):**

- Todos os endpoints retornam o envelope `{ data, status, message }` via `TransformInterceptor`.
- DTOs validados com `class-validator` e documentados em Swagger via `ApiWrappedResponse<T>`.
- Erros lançados com exceções Nest (`NotFoundException`, `ConflictException`, etc.) — tratados pelo `GlobalExceptionFilter`.
- Rotas autenticadas por padrão (JWT global). Use `@Public()` para abrir e `@Roles(UserRole.X)` para restringir.
- Persistência via Drizzle ORM, schemas em `src/modules/<dominio>/infra/schemas/`.
- Domain models seguem padrão `restore()` + `withX()` (imutabilidade controlada).

---

## Decisões transversais (defaults sugeridos)

Aplicadas como ponto de partida — confirmar/ajustar quando cada task for implementada.

- **Multi-tenant tardio:** filtro automático por instituição (`BE-46`) entra perto do fim. Endpoints intermediários recebem `institutionId` explícito no body/query e validamos manualmente; refatoramos para automático depois.
- **Soft delete em produtos:** `DELETE /products/:id` marca `deleted_at` em vez de remover fisicamente, preservando histórico de pedidos antigos. Vale também avaliar para extras e ingredientes durante a implementação.
- **Destaques curados:** campo `is_featured` no produto, marcado pelo SELLER (não agregação automática). Simples e dá controle direto à cantina.

> Essas três decisões podem ser revistas a qualquer momento — não são "set in stone".

---

## Ordem de execução — por macro escopo

Trabalhamos um macro escopo de cada vez. Dentro do grupo, faz-se as tasks em sequência. Quando uma task depende de outro grupo ainda não pronto, ela fica marcada com 🔁 e é finalizada (ou stub-ada) quando o grupo dependente estiver pronto.

| #     | Macro escopo                       | Tasks                                                  | Observação                                                                                                       |
| ----- | ---------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| 1     | **Auth**                     | BE-01, BE-02, BE-03, BE-04                             | ✅ entregues — refator necessário no 1.bis                                                                       |
| 1.bis | **Auth Hardening (refator)** | BE-47, BE-48, BE-49, BE-50, BE-51, BE-52, BE-53        | **Bloqueia tudo abaixo.** BE-47 (schema) é pré-requisito. Corrige falha crítica de segurança.            |
| 2     | **Localização**            | BE-08                                                  | ✅ concluída                                                                                                      |
| 3     | **Instituições**           | BE-05, BE-06, BE-07                                    | BE-05 ✅; faltam busca e contagem                                                                                  |
| 16    | **Users**                    | BE-54, BE-55, BE-56, BE-57, BE-58, BE-59, BE-60, BE-61 | Manutenção `/me` + gestão admin com escopo. Depende de 1.bis. **Substitui BE-40 e BE-10.**              |
| 4     | **Cantinas**                 | BE-09,~~BE-10~~, BE-11, BE-12, BE-13, BE-14           | BE-09 cria cantina + SELLER atomicamente (1:1). BE-10 absorvida por BE-09. BE-12/BE-14 dependem de Avaliações 🔁 |
| 5     | **Categorias**               | BE-15                                                  | independente                                                                                                       |
| 6     | **Produtos**                 | BE-16, BE-17, BE-18, BE-19, BE-20                      | BE-19 (ranking mais vendidos) depende de Pedidos 🔁                                                                |
| 7     | **Adicionais**               | BE-21, BE-22, BE-23                                    | depende de Produtos                                                                                                |
| 8     | **Ingrediente removível**   | BE-24                                                  | depende de Produtos                                                                                                |
| 9     | **Carrinho**                 | BE-25                                                  | depende de Produtos + Adicionais + Ingredientes                                                                    |
| 10    | **Pedidos**                  | BE-26, BE-27, BE-28, BE-29, BE-30, BE-31, BE-32        | depende de Carrinho                                                                                                |
| 11    | **Avaliações**             | BE-33, BE-34                                           | depende de Pedidos terminais.**Ao terminar, voltar e fechar BE-12/BE-14/BE-19 marcadas com 🔁**              |
| 12    | **Perfil**                   | ~~BE-40~~, BE-41                                      | BE-40 absorvida por BE-54. BE-41 (perfil cantina) permanece                                                        |
| 13    | **Relatórios**              | BE-35, BE-36, BE-37, BE-38, BE-39                      | depende de Pedidos                                                                                                 |
| 14    | **Infra (multi-tenant)**     | BE-46                                                  | refator transversal — depois das features funcionando                                                             |
| 15    | **Notificações**           | BE-42, BE-43                                           | dependem de Pedidos rodando                                                                                        |

> Ao começar cada macro escopo, revisamos o que mudou no projeto e abrimos a discussão de regras de negócio das tasks daquele grupo.

---

## 1. Auth

> 🔁 **Após validação de 2026-04-27**, as tasks 01–04 foram complementadas pelas tasks **BE-47 a BE-53** (seção `1.bis Auth Hardening — Refator`) — falha crítica de segurança no registro público, lookup no DB do JWT, soft delete, reativação de conta e rate-limit. As tasks originais permanecem registradas como concluídas em sua intenção inicial; o trabalho complementar está no refator.

### BE-01 — Auth: Login / Registro ⚠️

**Descrição:** Endpoints de autenticação básica com JWT.
**Critérios de aceite:**

- [X] `POST /auth/register` cria usuário com senha hasheada (bcrypt) e retorna `{ accessToken, user }`.
- [X] `POST /auth/login` valida credenciais e devolve `{ accessToken, user }`.
- [X] JWT assinado com `JWT_SECRET` e `expiresIn: 1d`.
- [X] Conflito de e-mail retorna 409.
- [X] Credenciais inválidas retornam 401 com mensagem genérica.
- [ ] *(Logout: stateless — fica a cargo do client descartar o token; sem endpoint dedicado.)*

### BE-02 — Auth: Recuperação de senha ⚠️

**Descrição:** Envio de código por e-mail, validação e reset de senha.
**Critérios de aceite:**

- [X] `POST /auth/forgot-password` gera código de 6 dígitos com TTL de 15min.
- [X] Resposta é genérica (não revela se o e-mail existe).
- [X] Códigos antigos do mesmo usuário são invalidados ao gerar um novo.
- [X] `POST /auth/verify-code` confirma se o código é válido.
- [X] `POST /auth/reset-password` troca a senha quando código for válido e marca como usado.
- [X] E-mail enviado via `EmailService` com template HTML.

### BE-03 — Auth: Validação de access_code ✅

**Descrição:** Endpoint público para validar código da instituição no registro.
**Critérios de aceite:**

- [X] `GET /institutions/validate/:accessCode` é público (sem JWT).
- [X] Retorna `{ id, name }` da instituição quando o código existir.
- [X] Retorna 404 quando não existir.
- [X] Pipe valida que o código tem exatamente 6 dígitos numéricos.

### BE-04 — Auth: Guards de role ⚠️

**Descrição:** Proteção de rotas por role: ADMIN, SELLER, CUSTOMER.
**Critérios de aceite:**

- [X] `JwtAuthGuard` registrado globalmente (default = autenticado).
- [X] `RolesGuard` registrado globalmente.
- [X] Decorator `@Roles(UserRole.X)` restringe rota a uma ou mais roles.
- [X] Decorator `@Public()` ignora autenticação.
- [X] Decorator `@CurrentUser()` extrai usuário do request.

---

## 1.bis Auth Hardening — Refator

Tasks criadas após validação dos resultados da seção 1. Ordem de execução crítica — BE-47 é pré-requisito de tudo neste bloco.

### BE-47 — Schema: 4 roles + soft delete + FKs reais ✅

**Descrição:** Migração que ajusta o schema `users` para refletir o ER atualizado.
**Critérios de aceite:**

- [X] Enum `user_role` passa a ter 4 valores: `ADMIN`, `INSTITUTION_ADMIN`, `SELLER`, `CUSTOMER`.
- [X] `users.institution_id` declarado com `references(institutions.id)` no schema Drizzle.
- [X] `users.canteen_id` permanece como `uuid` sem reference, com TODO apontando para BE-09.
- [X] Coluna `deleted_at TIMESTAMP WITH TIME ZONE NULL` adicionada.
- [X] Constraint `check_seller_has_canteen` substituída por `check_user_role_consistency` cobrindo os 4 roles.
- [X] Constraint UNIQUE em `email` substituída por `CREATE UNIQUE INDEX idx_users_email_unique_active ... WHERE deleted_at IS NULL`.
- [X] Migration `0003_abnormal_nova.sql` gerada e aplicada (banco de dev resetado).
- [X] `docs/db_model.sql` atualizado em paralelo.
- [X] Filtro `WHERE deleted_at IS NULL` aplicado em `DrizzleUserRepository.findByEmail` (escopo expandido).
- [X] **Commit:** `9a7b65b` — `refactor(users): hardening do schema users para ER canônico (BE-47)`

### BE-48 — Hardening do registro público ✅

**Descrição:** Corrigir a falha crítica em que qualquer um podia se registrar como ADMIN/SELLER.
**Critérios de aceite:**

- [X] `POST /auth/register` (público) aceita **apenas** `role = CUSTOMER`.
- [X] DTO exige `accessCode` (6 dígitos) — não mais `institutionId` direto.
- [X] Backend resolve `accessCode → institution.id` e popula `institutionId` no usuário.
- [X] Tentativa de enviar outro role retorna 400 (via `ValidationPipe` global com `forbidNonWhitelisted`).
- [X] Tentativa de cadastro com email já ativo retorna 409.
- [X] Email pode ser reutilizado se a conta anterior estiver soft-deleted (índice parcial da BE-47).
- [X] **Bônus:** `ValidationPipe` global ativado (descoberta lateral — validação class-validator não rodava antes).
- [X] **Commit:** `67e4743` — `fix(auth): hardening do registro público de clientes (BE-48)`

### BE-49 — JwtStrategy com lookup no DB ❌

**Descrição:** `JwtStrategy.validate()` passa a buscar o `User` no banco a cada request autenticado.
**Critérios de aceite:**

- [ ] `validate(payload)` busca `User` por `payload.sub` via `UserRepository`.
- [ ] Lança `UnauthorizedException` se `User` não existir ou `deleted_at != null`.
- [ ] Retorna o `User` do domínio (não o payload).
- [ ] `@CurrentUser()` passa a injetar `User` (atualizar tipo).
- [ ] `JwtPayload.role` tipado como `UserRole`, não `string`.

### BE-50 — Login com aviso de conta soft-deleted ❌

**Descrição:** `POST /auth/login` detecta conta inativa e retorna mensagem específica oferecendo reativação.
**Critérios de aceite:**

- [ ] Se credenciais corretas mas `deleted_at != null`, retorna 403 (não 401) com `code: ACCOUNT_DEACTIVATED`.
- [ ] Mensagem orienta uso de "Esqueci minha senha" ou rota de reativação.
- [ ] Não revela `deleted_at != null` quando senha está errada (mantém anti-enumeração).

### BE-51 — Reativação de conta via email ❌

**Descrição:** Rota dedicada que reativa conta soft-deleted após confirmação por código de email.
**Critérios de aceite:**

- [ ] `POST /auth/reactivation/request` envia código de 6 dígitos para o email (mesmo padrão do password recovery).
- [ ] Só envia se existe conta com aquele email + `deleted_at != null` E ninguém ativo tomou o email; resposta genérica caso contrário (anti-enumeração).
- [ ] `POST /auth/reactivation/confirm` recebe email + código; se válido, seta `deleted_at = null` e retorna `{ accessToken, user }`.
- [ ] Código TTL de 15min, idempotente (códigos antigos invalidados).

### BE-52 — Reset de senha reativa conta automaticamente ❌

**Descrição:** `POST /auth/reset-password` (BE-02) também reativa a conta quando ela está soft-deleted.
**Critérios de aceite:**

- [ ] Se a conta do código está soft-deleted, o reset seta `deleted_at = null` na mesma transação que troca a senha.
- [ ] Resposta indica que a conta foi reativada além de ter a senha trocada.
- [ ] Bloqueado se outro usuário já tomou o email no intervalo (409).

### BE-53 — Rate-limit em login e forgot-password ❌

**Descrição:** Proteção contra brute force e spam de email.
**Critérios de aceite:**

- [ ] `@nestjs/throttler` configurado globalmente com defaults conservadores.
- [ ] `POST /auth/login` limitado (ex.: 5 tentativas / minuto / IP).
- [ ] `POST /auth/forgot-password` e `POST /auth/reactivation/request` limitados (ex.: 3 / 10min / email).
- [ ] Resposta 429 padronizada no envelope de erro.

---

## 2. Instituição

### BE-05 — Instituição: CRUD ✅

**Descrição:** Criar, listar, editar e remover instituições.
**Critérios de aceite:**

- [X] `POST /institutions` (ADMIN) — cria com `name`, `stateId`, `cityId`, foto opcional.
- [X] `GET /institutions/:id` (ADMIN) — detalhe com nome do estado/cidade.
- [X] `PUT /institutions/:id` (ADMIN) — atualiza dados e/ou foto.
- [X] `DELETE /institutions/:id` (ADMIN) — remove.
- [X] `accessCode` de 6 dígitos gerado automaticamente, único, com retry de até 5 tentativas.
- [X] Foto enviada para MinIO em `institutions/{uuid}.{ext}`.

### BE-06 — Instituição: Listagem com busca ⚠️

**Descrição:** Listagem paginada com filtro/busca para tela admin.
**Critérios de aceite:**

- [X] `GET /institutions` (ADMIN) com paginação `?page=1&perPage=10`.
- [X] Resposta inclui `stateName` e `cityName`.
- [ ] Suporta filtro `?search=` por nome (case-insensitive, parcial).
- [ ] Suporta filtro `?stateId=` e `?cityId=`.
- [ ] Ordenação configurável por `?sortBy=name|createdAt`.

### BE-07 — Instituição: Contagem total ❌

**Descrição:** Endpoint de contagem para card do dashboard admin.
**Critérios de aceite:**

- [ ] `GET /institutions/count` (ADMIN) retorna `{ total: number }`.
- [ ] Query usa `count()` agregado, não carrega registros.
- [ ] Documentado no Swagger.

---

## 3. Localização

### BE-08 — Estado/Cidade: Listagem ✅

**Descrição:** Endpoints públicos para combos de endereço.
**Critérios de aceite:**

- [X] `GET /states` retorna todos os estados.
- [X] `GET /cities/state/:stateId` retorna cidades do estado.
- [X] Ambos públicos (`@Public()`).
- [X] Lista vazia de cidades retorna 404 com mensagem clara.

---

## 4. Cantina

### BE-09 — Cantina: CRUD ❌

**Descrição:** Criar, listar, editar e remover cantinas com vínculo à instituição. **Cada cantina cria automaticamente um usuário SELLER 1:1.**
**Critérios de aceite:**

- [ ] Schema `canteens` com: `id`, `institutionId` (FK), `name`, `cnpj`, `block`, `room`, `logoUrl`, `isOpen`, timestamps.
- [ ] `POST /canteens` (ADMIN ou INSTITUTION_ADMIN da própria instituição) — cria cantina **e** o SELLER vinculado em uma mesma transação. Body inclui dados do SELLER (nome, email, senha temporária).
- [ ] `GET /canteens/:id` — detalhe com nome da instituição.
- [ ] `PUT /canteens/:id` (escopo por role) — atualiza dados.
- [ ] `DELETE /canteens/:id` (escopo por role) — bloqueia se houver pedidos abertos. Soft delete da cantina **arrasta** o SELLER para soft delete.
- [ ] Toggle `PATCH /canteens/:id/toggle-open` (SELLER da cantina) — alterna `isOpen`.
- [ ] Validação: `cnpj` único por instituição.
- [ ] Regra: vínculo SELLER ↔ cantina é **1:1 imutável**. SELLER não pode ser desvinculado nem realocado.

### BE-10 — Cantina: Vínculo SELLER ⚠️

**Descrição:** ~~Atribuir vendedor responsável pela cantina~~ — **task absorvida por BE-09**, já que SELLER é criado junto com a cantina (1:1 imutável).
**Critérios de aceite:**

- [X] Coberto por BE-09 (criação atômica de cantina + SELLER).
- [ ] *Manter aqui apenas como referência histórica — sem implementação separada.*

### BE-11 — Cantina: Upload de logo ❌

**Descrição:** Upload e armazenamento da logo no MinIO.
**Critérios de aceite:**

- [ ] `POST /canteens` e `PUT /canteens/:id` aceitam `multipart/form-data` com campo `logo`.
- [ ] Logo salva em `canteens/{uuid}.{ext}` no MinIO.
- [ ] URL pública persistida em `canteens.logo_url`.
- [ ] Aceita apenas `image/png`, `image/jpeg`, `image/webp` com tamanho máx de 2MB.

### BE-12 — Cantina: Listagem por instituição ❌

**Descrição:** Endpoint para listar cantinas filtrando pela instituição do usuário.
**Critérios de aceite:**

- [ ] `GET /canteens` retorna cantinas da `institutionId` do usuário logado (CUSTOMER/SELLER).
- [ ] ADMIN pode passar `?institutionId=` explicitamente.
- [ ] Suporta paginação e busca por `?search=` no nome.
- [ ] Resposta inclui `averageRating` (média de avaliações) e `isOpen`.

### BE-13 — Cantina: Contagem total ❌

**Descrição:** Endpoint de contagem para card do dashboard admin.
**Critérios de aceite:**

- [ ] `GET /canteens/count` (ADMIN) retorna `{ total: number }`.
- [ ] Suporta filtro opcional `?institutionId=`.

### BE-14 — Cantina: Média de avaliações ❌

**Descrição:** Cálculo agregado da média de estrelas da cantina.
**Critérios de aceite:**

- [ ] `GET /canteens/:id/rating` retorna `{ average: number, count: number }`.
- [ ] Média calculada com `AVG(rating)` no Postgres (sem trazer os ratings).
- [ ] Cantina sem avaliações retorna `{ average: 0, count: 0 }`.
- [ ] Valor reaproveitado em `BE-12` (listagem por instituição).

---

## 5. Categoria

### BE-15 — Categoria: CRUD ❌

**Descrição:** Cadastro das categorias de cardápio (Salgados, Bebidas, Assados, Doces, etc.).
**Critérios de aceite:**

- [ ] Schema `categories` com `id`, `name` único, `iconKey`, `displayOrder`, timestamps.
- [ ] `POST /categories` (ADMIN) — cria categoria global.
- [ ] `GET /categories` — público; retorna lista ordenada por `displayOrder`.
- [ ] `PUT /categories/:id` (ADMIN) — atualiza nome/icone/ordem.
- [ ] `DELETE /categories/:id` (ADMIN) — bloqueia se houver produtos vinculados.

---

## 6. Produto

### BE-16 — Produto: CRUD ❌

**Descrição:** Criar, listar, editar e remover produtos com foto, preço, categoria, ingredientes, ativo/inativo.
**Critérios de aceite:**

- [ ] Schema `products` com `id`, `canteenId` (FK), `categoryId` (FK), `name`, `description`, `price`, `photoUrl`, `isActive`, `isFeatured`, `deletedAt`, timestamps.
- [ ] `POST /products` (SELLER da cantina) — cria produto na própria cantina.
- [ ] `GET /products/:id` — detalhe com categoria, adicionais e ingredientes removíveis.
- [ ] `PUT /products/:id` (SELLER) — atualiza dados, alterna `isActive`.
- [ ] `DELETE /products/:id` (SELLER) — **soft delete** (marca `deletedAt`) para preservar histórico de pedidos.
- [ ] Preço armazenado em `numeric(10,2)`, validação `> 0`.

### BE-17 — Produto: Upload de foto ❌

**Descrição:** Upload da foto do produto no MinIO.
**Critérios de aceite:**

- [ ] `POST /products` e `PUT /products/:id` aceitam `multipart/form-data` com campo `photo`.
- [ ] Foto salva em `products/{uuid}.{ext}`.
- [ ] Tipos aceitos: `image/png`, `image/jpeg`, `image/webp`. Máx 2MB.
- [ ] URL persistida em `products.photo_url`.

### BE-18 — Produto: Listagem filtrada ❌

**Descrição:** Listagem por cantina + categoria + busca.
**Critérios de aceite:**

- [ ] `GET /products?canteenId=&categoryId=&search=&onlyActive=true` paginado.
- [ ] `canteenId` obrigatório (cliente sempre lista de uma cantina por vez).
- [ ] Filtro `onlyActive=true` (default) esconde produtos inativos para CUSTOMER; SELLER vê todos.
- [ ] Resposta inclui categoria embutida.

### BE-19 — Produto: Ranking mais vendidos ❌

**Descrição:** Endpoint agregado dos produtos mais vendidos para a home cliente.
**Critérios de aceite:**

- [ ] `GET /products/top-selling?institutionId=&limit=10` retorna produtos ordenados por quantidade vendida.
- [ ] Considera apenas pedidos com status `RETIRADO` (não cancelados).
- [ ] Filtra por instituição do usuário logado (multi-tenant).
- [ ] Período opcional `?days=30` (default: 30 dias).

### BE-20 — Produto: Ranking destaques ❌

**Descrição:** Endpoint dos destaques (curado pelo SELLER via `isFeatured`).
**Critérios de aceite:**

- [ ] `GET /products/featured?institutionId=&limit=10` retorna produtos com `isFeatured = true`.
- [ ] `PATCH /products/:id/feature` (SELLER) marca como destaque.
- [ ] `PATCH /products/:id/unfeature` (SELLER) remove destaque.
- [ ] Considerar limite máximo de destaques por cantina (definir na implementação).

---

## 7. Adicionais

### BE-21 — Adicional: CRUD ❌

**Descrição:** Criar, listar, editar e remover adicionais com nome e preço.
**Critérios de aceite:**

- [ ] Schema `extras` com `id`, `canteenId` (FK), `name`, `price`, `isActive`, `deletedAt`, timestamps.
- [ ] `POST /extras` (SELLER) — cria adicional na própria cantina.
- [ ] `GET /extras?canteenId=` paginado, filtrado por cantina.
- [ ] `PUT /extras/:id` (SELLER) — atualiza.
- [ ] `DELETE /extras/:id` (SELLER) — **soft delete** (marca `deletedAt`) para preservar snapshots em pedidos antigos.

### BE-22 — Adicional: Relação N:N com Produto ❌

**Descrição:** Vínculo de adicionais a múltiplos produtos.
**Critérios de aceite:**

- [ ] Schema `product_extras` (`product_id`, `extra_id`) com PK composta.
- [ ] `POST /products/:id/extras` (SELLER) — adiciona um ou mais extras ao produto.
- [ ] `DELETE /products/:id/extras/:extraId` (SELLER) — remove vínculo.
- [ ] Validação: produto e extra devem pertencer à mesma cantina.

### BE-23 — Adicional: Listagem por produto ❌

**Descrição:** Endpoint para carregar adicionais de um produto específico.
**Critérios de aceite:**

- [ ] `GET /products/:id/extras` retorna lista de extras vinculados.
- [ ] Ordena por nome.
- [ ] Inclui apenas extras com `isActive = true` para CUSTOMER.

---

## 8. Ingrediente Removível

### BE-24 — Ingrediente Removível ❌

**Descrição:** Lista de ingredientes que podem ser removidos no produto.
**Critérios de aceite:**

- [ ] Schema `product_removable_ingredients` (`id`, `product_id`, `name`).
- [ ] `POST /products/:id/removable-ingredients` (SELLER) — cria/atualiza lista (substitui em batch).
- [ ] `GET /products/:id/removable-ingredients` retorna lista.
- [ ] Lista incluída automaticamente no `GET /products/:id`.

---

## 9. Carrinho

### BE-25 — Carrinho: Regra de uma cantina ❌

**Descrição:** Validação: 1 carrinho contém itens de apenas uma cantina.
**Critérios de aceite:**

- [ ] Schema `cart_items` com `id`, `userId`, `productId`, `quantity`, `note`, `createdAt`.
- [ ] Schema `cart_item_extras` (N:N entre item e extras escolhidos).
- [ ] `POST /cart/items` adiciona item; bloqueia (409) se o produto for de cantina diferente da do carrinho atual.
- [ ] `DELETE /cart` esvazia carrinho do usuário.
- [ ] `GET /cart` retorna itens com produto, extras escolhidos, ingredientes removidos e subtotal.
- [ ] `PATCH /cart/items/:id` atualiza quantidade.

---

## 10. Pedido

### BE-26 — Pedido: Criação com snapshot ❌

**Descrição:** Criar pedido preservando preço histórico de produto e adicional.
**Critérios de aceite:**

- [ ] Schema `orders` com: `id`, `userId`, `canteenId`, `status`, `total`, `rating`, `ratingComment`, `createdAt`, `updatedAt`.
- [ ] Schema `order_items` com: `id`, `orderId`, `productId`, `productNameSnapshot`, `unitPriceAtPurchase`, `quantity`, `note`.
- [ ] Schema `order_item_extras` com: `id`, `orderItemId`, `extraId`, `extraNameSnapshot`, `unitPriceAtPurchase`.
- [ ] `POST /orders` cria pedido a partir do carrinho atual do usuário; copia preço atual de produto e extra como snapshot.
- [ ] Esvazia o carrinho ao finalizar.
- [ ] Cantina deve estar `isOpen`; senão 409.
- [ ] Status inicial: `AGUARDANDO`.

### BE-27 — Pedido: Máquina de estados ❌

**Descrição:** AGUARDANDO → EM_PREPARO → PRONTO → AGUARDANDO_RETIRADA → RETIRADO/CANCELADO.
**Critérios de aceite:**

- [ ] Enum `order_status` com os 6 valores.
- [ ] Transições válidas centralizadas em uma função/serviço (não espalhadas no controller).
- [ ] Transições inválidas lançam 409 com mensagem clara.
- [ ] `CANCELADO` permitido a partir de `AGUARDANDO`, `EM_PREPARO` ou `PRONTO`.
- [ ] Toda transição registra `updatedAt`.

### BE-28 — Pedido: Avanço de status (vendedor) ❌

**Descrição:** Endpoint para vendedor avançar status do pedido.
**Critérios de aceite:**

- [ ] `PATCH /orders/:id/advance` (SELLER da cantina) avança o pedido para o próximo estado válido.
- [ ] Bloqueia se o pedido for de outra cantina (403).
- [ ] Retorna o pedido atualizado.

### BE-29 — Pedido: Confirmação de retirada (cliente) ❌

**Descrição:** Endpoint para cliente confirmar retirada (botão JÁ RETIREI).
**Critérios de aceite:**

- [ ] `PATCH /orders/:id/pickup` (CUSTOMER dono do pedido) move de `AGUARDANDO_RETIRADA` para `RETIRADO`.
- [ ] Bloqueia se o pedido estiver em outro status.
- [ ] Bloqueia se o usuário não for o dono.

### BE-30 — Pedido: Listagem cliente ❌

**Descrição:** Pedidos em aberto + histórico do cliente logado.
**Critérios de aceite:**

- [ ] `GET /orders/me?status=open|history` filtra por aberto (não terminal) ou histórico (`RETIRADO`/`CANCELADO`).
- [ ] Paginação simples.
- [ ] Inclui itens, extras e dados básicos da cantina.

### BE-31 — Pedido: Listagem cantina (fila) ❌

**Descrição:** Listagem por cantina filtrada por status para o vendedor.
**Critérios de aceite:**

- [ ] `GET /orders/canteen?status=` (SELLER da cantina) lista pedidos do próprio canteen.
- [ ] Suporta múltiplos status no filtro (`?status=AGUARDANDO,EM_PREPARO`).
- [ ] Ordenação por `createdAt ASC` (mais antigos primeiro = ordem de fila).
- [ ] Paginação.

### BE-32 — Pedido: Cancelamento ❌

**Descrição:** Endpoint de cancelamento de pedido.
**Critérios de aceite:**

- [ ] `PATCH /orders/:id/cancel` cancelável por:
  - CUSTOMER dono (apenas em `AGUARDANDO`).
  - SELLER da cantina (em `AGUARDANDO`, `EM_PREPARO`, `PRONTO`).
- [ ] Body opcional com `reason`.
- [ ] Pedido cancelado é imutável (não pode ser revertido).

---

## 11. Avaliação

### BE-33 — Avaliação: Criar ❌

**Descrição:** Cliente avalia pedido finalizado (rating 1-5 + comentário opcional, 1 por pedido).
**Critérios de aceite:**

- [ ] `PATCH /orders/:id/rating` (CUSTOMER dono) define `rating` (1-5) e `ratingComment` opcional.
- [ ] Permitido apenas em pedidos com status `RETIRADO`.
- [ ] Não permite avaliar duas vezes (`rating` não-nulo bloqueia).
- [ ] Validação: rating ∈ [1, 5].

### BE-34 — Avaliação: Listagem e média ❌

**Descrição:** Listagem de avaliações da cantina com média agregada.
**Critérios de aceite:**

- [ ] `GET /canteens/:id/ratings` paginado, ordenado por mais recente.
- [ ] Inclui rating, comentário, nome do cliente, data.
- [ ] Resposta inclui média geral (`{ average, count }`) — reaproveita `BE-14`.

---

## 12. Relatórios

### BE-35 — Relatórios: Receita por período ❌

**Descrição:** Receita total agregada com variação percentual.
**Critérios de aceite:**

- [ ] `GET /reports/revenue?canteenId=&from=&to=` retorna `{ current, previous, deltaPercent }`.
- [ ] `previous` é o período anterior de mesmo tamanho.
- [ ] Soma apenas pedidos `RETIRADO`.
- [ ] Default sem `from`/`to`: últimos 30 dias.

### BE-36 — Relatórios: Total de pedidos ❌

**Descrição:** Total de pedidos por período com variação percentual.
**Critérios de aceite:**

- [ ] `GET /reports/orders-count?canteenId=&from=&to=` retorna `{ current, previous, deltaPercent }`.
- [ ] Conta pedidos `RETIRADO` (excluindo cancelados).
- [ ] Default últimos 30 dias.

### BE-37 — Relatórios: Tendência 7 dias ❌

**Descrição:** Série temporal de receita dos últimos 7 dias.
**Critérios de aceite:**

- [ ] `GET /reports/revenue-trend?canteenId=` retorna array de 7 entradas: `[{ date, total }]`.
- [ ] Inclui dias sem receita (total = 0).
- [ ] Datas no fuso configurado (default UTC ou `America/Sao_Paulo` — definir).

### BE-38 — Relatórios: Top produtos ❌

**Descrição:** Ranking dos produtos mais vendidos por cantina.
**Critérios de aceite:**

- [ ] `GET /reports/top-products?canteenId=&limit=5&days=30` retorna `[{ productId, name, quantity, revenue }]`.
- [ ] Considera apenas pedidos `RETIRADO`.
- [ ] Ordenação por quantidade desc.

### BE-39 — Relatórios: Counts globais admin ❌

**Descrição:** Contagens de instituições e cantinas para dashboard admin.
**Critérios de aceite:**

- [ ] `GET /reports/admin-counts` (ADMIN) retorna `{ institutions: number, canteens: number }`.
- [ ] Pode ser unificado com `BE-07` e `BE-13`, ou consumir esses dois.

---

## 13. Perfil

### BE-40 — Perfil: GET/PATCH cliente ⚠️

**Descrição:** ~~Edição do perfil do cliente~~ — **absorvida pela BE-54** (manutenção da própria conta), que cobre todos os roles, não só CUSTOMER. Email **não é editável** (decisão tomada em 2026-04-27).
**Critérios de aceite:**

- [X] Coberto por BE-54.

### BE-41 — Perfil: GET/PATCH cantina ❌

**Descrição:** Edição do perfil da loja (nome, CNPJ, e-mail comercial, bloco/sala, foto).
**Critérios de aceite:**

- [ ] `GET /canteens/me` (SELLER) retorna a cantina vinculada ao usuário logado.
- [ ] `PATCH /canteens/me` (SELLER) atualiza `name`, `cnpj`, `block`, `room`, `logoUrl`, `commercialEmail`.
- [ ] Validação de CNPJ no formato.
- [ ] Foto via MinIO (reaproveita `BE-11`).

---

## 14. Notificações

### BE-42 — Notificação: Push novo pedido ❌

**Descrição:** Push notification para vendedor quando há pedido novo.
**Critérios de aceite:**

- [ ] Schema `device_tokens` (`userId`, `token`, `platform`, `createdAt`).
- [ ] `POST /devices/register` registra token de FCM/APNs do usuário.
- [ ] Ao criar pedido (`BE-26`), dispara push para o SELLER da cantina.
- [ ] Provider de push abstraído atrás de uma interface (`NotificationProvider`).
- [ ] Falha de envio é logada mas não bloqueia a criação do pedido.

### BE-43 — Notificação: Push pedido pronto ❌

**Descrição:** Push notification para cliente quando o pedido fica pronto.
**Critérios de aceite:**

- [ ] Ao transicionar para `PRONTO` ou `AGUARDANDO_RETIRADA` (`BE-27`/`BE-28`), dispara push para o CUSTOMER.
- [ ] Mensagem inclui número/identificador do pedido.
- [ ] Falha de envio é logada mas não bloqueia a transição.

---

## 15. Infra

### BE-44 — Infra: Upload MinIO ✅

**Descrição:** Serviço de upload reutilizável (foto produto, logo cantina, foto perfil, foto loja).
**Critérios de aceite:**

- [X] `MinioService` em `src/shared/infra/storage/minio.service.ts`.
- [X] `upload(key, buffer, contentType)` retorna URL pública.
- [X] `delete(key)` remove objeto.
- [X] `getFileUrl(key)` monta URL.
- [X] Bucket criado automaticamente no boot.
- [ ] *(Validação de tipo/tamanho de arquivo será feita em cada controller que consumir.)*

### BE-45 — Infra: Email service ✅

**Descrição:** Serviço de envio de e-mail (recuperação de senha).
**Critérios de aceite:**

- [X] `EmailService` em `src/shared/infra/email/email.service.ts`.
- [X] Configurável via env (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`).
- [X] Método `sendEmail(to, subject, html)`.
- [X] Falhas logadas e propagadas como `InternalServerErrorException`.
- [X] Template `buildPasswordRecoveryEmail` reutilizável.

### BE-46 — Infra: Filtro multi-tenant ❌

**Descrição:** Filtragem automática por instituição em queries do cliente. Entra na **Fase 7**, depois do MVP de pedidos — até lá, endpoints recebem `institutionId` explícito e validam manualmente.
**Critérios de aceite:**

- [ ] Decorator/interceptor que extrai `institutionId` do JWT do CUSTOMER/INSTITUTION_ADMIN.
- [ ] Aplicado automaticamente em endpoints que retornam dados escopados (cantinas, produtos, etc.).
- [ ] ADMIN pode passar `institutionId` explicitamente para sobrepor.
- [ ] SELLER já é escopado pela cantina (que tem `institutionId`).
- [ ] Refatora endpoints anteriores que faziam filtro manual.
- [ ] Documentado em `docs/arquitetura.md`.

---

## 16. Users (gestão administrativa + manutenção de conta)

Macro escopo criado após validação de 2026-04-27. Cobre `/me` (próprio usuário) e gestão administrativa (`/users` para ADMIN/INSTITUTION_ADMIN).

### BE-54 — Conta: GET/PATCH/DELETE /me ❌

**Descrição:** Manutenção da própria conta para qualquer role autenticado.
**Critérios de aceite:**

- [ ] `GET /me` retorna o usuário logado (sem `passwordHash`).
- [ ] `PATCH /me` atualiza `fullName`, `phoneNumber`, `profilePhotoUrl`. **Email não é editável.**
- [ ] `DELETE /me` faz soft delete (`deleted_at = now()`).
- [ ] CUSTOMER pode soft-deletar sem restrições.
- [ ] SELLER **não pode** soft-deletar a si mesmo (cantina ↔ usuário 1:1; só some via DELETE da cantina).
- [ ] ADMIN não pode soft-deletar a si mesmo (proteção contra ficar sem ADMIN).
- [ ] INSTITUTION_ADMIN pode soft-deletar a si mesmo.

### BE-55 — Conta: Migração de instituição (CUSTOMER) ❌

**Descrição:** CUSTOMER troca de instituição informando novo `accessCode`.
**Critérios de aceite:**

- [ ] `POST /me/migrate-institution` (CUSTOMER) — body `{ accessCode }`.
- [ ] Valida `accessCode`, troca `institution_id`, limpa carrinho atual (itens da instituição antiga).
- [ ] Retorna usuário atualizado.
- [ ] Bloqueado para outros roles (403).

### BE-56 — Users: Listagem admin com escopo ❌

**Descrição:** Listagem de usuários para ADMIN e INSTITUTION_ADMIN.
**Critérios de aceite:**

- [ ] `GET /users?page=&perPage=&search=&role=&institutionId=` paginado.
- [ ] ADMIN vê todos.
- [ ] INSTITUTION_ADMIN vê **apenas** usuários da própria instituição (CUSTOMERs e SELLERs).
- [ ] Filtros por `role` e `search` (nome ou email).
- [ ] Inclui `deleted_at` no DTO (para mostrar contas inativas).
- [ ] Filtro `?onlyActive=true` (default) esconde soft-deleted; `false` inclui.

### BE-57 — Users: Criar ADMIN ou INSTITUTION_ADMIN ❌

**Descrição:** Endpoint admin para criar contas privilegiadas.
**Critérios de aceite:**

- [ ] `POST /users` (apenas ADMIN) cria ADMIN ou INSTITUTION_ADMIN.
- [ ] Body: `fullName`, `email`, `password` (ou senha temporária), `role`, `institutionId` (obrigatório se INSTITUTION_ADMIN).
- [ ] Bloqueia criação de SELLER por aqui (SELLER vem via cantina).
- [ ] Bloqueia criação de CUSTOMER por aqui (CUSTOMER usa `/auth/register`).
- [ ] Email único entre ativos.

### BE-58 — Users: Editar com escopo ❌

**Descrição:** Editar dados de qualquer usuário com escopo apropriado.
**Critérios de aceite:**

- [ ] `PATCH /users/:id` atualiza `fullName`, `phoneNumber`, `profilePhotoUrl`. Email **não editável** (consistente com `/me`).
- [ ] ADMIN edita qualquer um.
- [ ] INSTITUTION_ADMIN edita apenas usuários da própria instituição.
- [ ] Não permite editar campos que mudam role/institution/canteen (existe BE-59 para role).

### BE-59 — Users: Mudar role (ADMIN-only) ❌

**Descrição:** Promover/rebaixar usuário entre roles compatíveis.
**Critérios de aceite:**

- [ ] `PATCH /users/:id/role` (apenas ADMIN).
- [ ] Transições válidas explícitas. Ex.: CUSTOMER ↔ INSTITUTION_ADMIN OK; qualquer coisa para SELLER **bloqueada** (SELLER nasce via cantina).
- [ ] Auto-rebaixamento de ADMIN bloqueado se for o último ADMIN.
- [ ] Mudança consistente com check constraints (popular/limpar `institution_id` e `canteen_id` conforme novo role).

### BE-60 — Users: Soft delete com escopo ❌

**Descrição:** ADMIN/INSTITUTION_ADMIN desativam contas.
**Critérios de aceite:**

- [ ] `DELETE /users/:id` faz soft delete.
- [ ] ADMIN pode desativar qualquer um, exceto si próprio (proteção do último ADMIN).
- [ ] INSTITUTION_ADMIN desativa apenas usuários da própria instituição.
- [ ] **Bloqueio:** SELLER com pedidos abertos não pode ser desativado (use `DELETE /canteens/:id` quando estiver disponível e a cantina não tiver pedidos abertos).
- [ ] CUSTOMER com pedidos abertos: avalia caso a caso na implementação (sugestão: bloquear).

### BE-61 — Users: Forçar reset de senha ❌

**Descrição:** Admin gera código de recuperação e envia ao email do usuário.
**Critérios de aceite:**

- [ ] `POST /users/:id/force-reset-password` (ADMIN ou INSTITUTION_ADMIN com escopo).
- [ ] Reaproveita o fluxo de `password_recovery` — gera código, envia email.
- [ ] Mensagem de email indica que foi acionado por administrador.

---

## Resumo

Após validação de 2026-04-27, o backlog passou de 46 para 61 tasks. Algumas tasks da Auth original foram marcadas ⚠️ (precisam refator nas tasks BE-47..BE-53), e duas foram absorvidas (BE-10 ↦ BE-09, BE-40 ↦ BE-54).

| Área                    | Total        | ✅          | ⚠️        | ❌           |
| ------------------------ | ------------ | ----------- | ----------- | ------------ |
| Auth (original)          | 4            | 1           | 3           | 0            |
| Auth Hardening (refator) | 7            | 0           | 0           | 7            |
| Instituição            | 3            | 1           | 1           | 1            |
| Localização            | 1            | 1           | 0           | 0            |
| Users (gestão + /me)    | 8            | 0           | 0           | 8            |
| Cantina                  | 6            | 0           | 1           | 5            |
| Categoria                | 1            | 0           | 0           | 1            |
| Produto                  | 5            | 0           | 0           | 5            |
| Adicional                | 3            | 0           | 0           | 3            |
| Ingrediente              | 1            | 0           | 0           | 1            |
| Carrinho                 | 1            | 0           | 0           | 1            |
| Pedido                   | 7            | 0           | 0           | 7            |
| Avaliação              | 2            | 0           | 0           | 2            |
| Relatórios              | 5            | 0           | 0           | 5            |
| Perfil                   | 2            | 0           | 1           | 1            |
| Notificações           | 2            | 0           | 0           | 2            |
| Infra                    | 3            | 2           | 0           | 1            |
| **Total**          | **61** | **5** | **6** | **50** |

> **⚠️** indica task entregue mas que será revisitada/absorvida por outra; **✅** = entregue e validada conforme escopo atual; **❌** = pendente.
