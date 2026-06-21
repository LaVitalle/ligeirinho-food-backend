# Migração do Frontend — Monólito → Microsserviços

> **TL;DR:** os **paths e os payloads não mudaram**. A única alteração obrigatória no frontend é a **base URL**: tudo passa a apontar para o **gateway**. As respostas continuam no mesmo envelope `{ data, status, pagination }` (agora podendo trazer `_links`). Há **1 mudança de comportamento** (criação de cantina virou assíncrona) — ver o fim do doc.

## 1. Base URL (a única mudança obrigatória)

| | Antes | Depois |
|---|---|---|
| Base URL | `<base-do-monólito>` (ex.: `http://localhost:3000`) | `https://apps-gateway.6x97ra.easypanel.host` |

Regra geral:

```
Path anterior:  <BASE_ANTIGA>/<rota>
Novo path:      https://apps-gateway.6x97ra.easypanel.host/<rota>     (MESMA <rota>)
```

O gateway roteia internamente para o microsserviço certo — o frontend não precisa saber qual serviço atende cada rota. Basta trocar a base URL do cliente HTTP.

> Cada serviço também tem Swagger acessível pelo gateway: `/identity/docs`, `/catalog/docs`, `/orders/docs`.

## 2. Mapa de endpoints (path e payload **iguais** ao monólito)

Legenda de auth: 🔓 público · 🔑 autenticado (qualquer role) · 👤 roles específicas.

### Autenticação — `/auth`
| Método | Path (igual antes/depois) | Auth | Payload |
|---|---|---|---|
| POST | `/auth/register` | 🔓 | `{ fullName, email, password, phoneNumber?, accessCode }` — igual |
| POST | `/auth/login` | 🔓 | `{ email, password }` — igual |
| POST | `/auth/forgot-password` | 🔓 | `{ email }` — igual |
| POST | `/auth/verify-code` | 🔓 | `{ email, code }` — igual |
| POST | `/auth/reset-password` | 🔓 | `{ email, code, newPassword }` — igual |
| POST | `/auth/reactivation/request` | 🔓 | `{ email }` — igual |
| POST | `/auth/reactivation/confirm` | 🔓 | `{ email, code }` — igual |

### Perfil do usuário logado — `/me`
| Método | Path | Auth | Payload |
|---|---|---|---|
| GET | `/me` | 🔑 | — |
| PATCH | `/me` | 🔑 | `{ fullName?, phoneNumber?, profilePhotoUrl? }` — igual |
| DELETE | `/me` | 🔑 | — |
| POST | `/me/migrate-institution` | 👤 CUSTOMER | `{ accessCode }` — igual |

### Usuários (admin) — `/users`
| Método | Path | Auth | Payload |
|---|---|---|---|
| GET | `/users` | 👤 ADMIN, INSTITUTION_ADMIN | query: `page, perPage, search, role, institutionId, onlyActive` |
| POST | `/users` | 👤 ADMIN | `{ fullName, email, password, role, institutionId? }` — igual |
| PATCH | `/users/:id` | 👤 ADMIN, INSTITUTION_ADMIN | `{ fullName?, phoneNumber?, profilePhotoUrl? }` — igual |
| PATCH | `/users/:id/role` | 👤 ADMIN | `{ role }` — igual |
| DELETE | `/users/:id` | 👤 ADMIN, INSTITUTION_ADMIN | — |
| POST | `/users/:id/force-reset-password` | 👤 ADMIN, INSTITUTION_ADMIN | — |

### Instituições — `/institutions`
| Método | Path | Auth | Payload |
|---|---|---|---|
| POST | `/institutions` | 👤 ADMIN | **multipart/form-data**: `name, stateId, cityId, photo?` — igual |
| GET | `/institutions` | 👤 ADMIN | query: `page, perPage, search, stateId, cityId, sortBy` |
| GET | `/institutions/count` | 👤 ADMIN | — |
| GET | `/institutions/validate/:accessCode` | 🔓 | — |
| GET | `/institutions/:id` | 👤 ADMIN | — |
| PUT | `/institutions/:id` | 👤 ADMIN | **multipart/form-data**: `name?, stateId?, cityId?, photo?` — igual |
| DELETE | `/institutions/:id` | 👤 ADMIN | — |

### Localização — `/states`, `/cities`
| Método | Path | Auth | Payload |
|---|---|---|---|
| GET | `/states` | 🔓 | — |
| GET | `/cities/:stateId` | 🔓 | — |

### Cantinas — `/canteens`
| Método | Path | Auth | Payload |
|---|---|---|---|
| POST | `/canteens` | 👤 ADMIN, INSTITUTION_ADMIN | `{ name, institutionId, cnpj?, block?, room?, sellerName, sellerEmail, sellerPassword }` — igual ⚠️ (ver §3) |
| GET | `/canteens` | 🔑 | query: `page, perPage, institutionId, search` |
| GET | `/canteens/count` | 👤 ADMIN | — |
| GET | `/canteens/me` | 👤 SELLER | — |
| PATCH | `/canteens/me` | 👤 SELLER | `{ name?, cnpj?, block?, room? }` — igual |
| GET | `/canteens/:id` | 🔑 | — |
| PUT | `/canteens/:id` | 👤 ADMIN, INSTITUTION_ADMIN, SELLER | `{ name?, cnpj?, block?, room? }` — igual |
| DELETE | `/canteens/:id` | 👤 ADMIN, INSTITUTION_ADMIN | — |
| PATCH | `/canteens/:id/toggle-open` | 👤 SELLER | — |
| POST | `/canteens/:id/logo` | 👤 ADMIN, INSTITUTION_ADMIN, SELLER | **multipart/form-data**: `logo` — igual |

### Categorias — `/categories`
| Método | Path | Auth | Payload |
|---|---|---|---|
| POST | `/categories` | 👤 ADMIN | `{ name, ... }` — igual |
| GET | `/categories` | 🔓 | — |
| PUT | `/categories/:id` | 👤 ADMIN | igual |
| DELETE | `/categories/:id` | 👤 ADMIN | — |

### Produtos — `/products`
| Método | Path | Auth | Payload |
|---|---|---|---|
| POST | `/products` | 👤 SELLER | igual ao monólito |
| GET | `/products/featured` | 🔓 | — |
| GET | `/products` | 🔓 | query igual |
| GET | `/products/:id` | 🔓 | — |
| PUT | `/products/:id` | 👤 SELLER | igual |
| DELETE | `/products/:id` | 👤 SELLER | — |
| POST | `/products/:id/photo` | 👤 SELLER | **multipart/form-data**: `photo` — igual |
| PATCH | `/products/:id/feature` | 👤 SELLER | — |
| PATCH | `/products/:id/unfeature` | 👤 SELLER | — |

### Adicionais / Ingredientes — `/extras`, `/products/:id/...`
| Método | Path | Auth | Payload |
|---|---|---|---|
| POST | `/extras` | 👤 SELLER | igual |
| GET | `/extras` | 🔓 | — |
| PUT | `/extras/:id` | 👤 SELLER | igual |
| DELETE | `/extras/:id` | 👤 SELLER | — |
| POST | `/products/:productId/extras` | 👤 SELLER | igual |
| DELETE | `/products/:productId/extras/:extraId` | 👤 SELLER | — |
| GET | `/products/:productId/extras` | 🔓 | — |
| POST | `/products/:productId/removable-ingredients` | 👤 SELLER | igual |
| GET | `/products/:productId/removable-ingredients` | 🔓 | — |

### Carrinho — `/cart`
| Método | Path | Auth | Payload |
|---|---|---|---|
| POST | `/cart/items` | 👤 CUSTOMER | igual ⚠️ (ver §3, adicionais) |
| GET | `/cart` | 👤 CUSTOMER | — |
| PATCH | `/cart/items/:id` | 👤 CUSTOMER | igual |
| DELETE | `/cart/items/:id` | 👤 CUSTOMER | — |
| DELETE | `/cart` | 👤 CUSTOMER | — |

### Pedidos — `/orders`
| Método | Path | Auth | Payload |
|---|---|---|---|
| POST | `/orders` | 👤 CUSTOMER | igual |
| GET | `/orders/me` | 👤 CUSTOMER | query igual |
| GET | `/orders/canteen` | 👤 SELLER | query igual |
| GET | `/orders/:id` | 🔑 | — |
| PATCH | `/orders/:id/advance` | 👤 SELLER | — |
| PATCH | `/orders/:id/pickup` | 👤 CUSTOMER | — |
| PATCH | `/orders/:id/cancel` | 👤 CUSTOMER, SELLER | — |
| PATCH | `/orders/:id/rating` | 👤 CUSTOMER | `{ stars, comment? }` — igual |

### Avaliações de cantina — `/canteens/:id/ratings`
| Método | Path | Auth | Payload |
|---|---|---|---|
| GET | `/canteens/:id/ratings` | 🔓 | — |
| GET | `/canteens/:id/rating` | 🔓 | — |

> Atendidas pelo serviço de **orders** (não pelo catalog), mas o gateway resolve isso internamente — **o path para o frontend é o mesmo**.

### Relatórios — `/reports`
| Método | Path | Auth | Payload |
|---|---|---|---|
| GET | `/reports/revenue` | 👤 SELLER, ADMIN | query igual |
| GET | `/reports/orders-count` | 👤 SELLER, ADMIN | query igual |
| GET | `/reports/revenue-trend` | 👤 SELLER, ADMIN | query igual |
| GET | `/reports/top-products` | 👤 SELLER, ADMIN | query igual |
| GET | `/reports/admin-counts` | 👤 ADMIN | — |

## 3. O que realmente mudou (atenção do frontend)

1. **Base URL → gateway** (obrigatório). É a única troca de fato necessária no cliente HTTP.

2. **Respostas podem trazer `_links` (HATEOAS) — aditivo.** O envelope continua `{ data, status, pagination }`. Em endpoints com hipermídia, o objeto em `data` (ou cada item de lista) ganha um campo extra `_links` com ações relacionadas, e listas podem trazer `_links` no topo. **Se o frontend não usar, é só ignorar** — nada existente foi removido ou renomeado. Exemplo:
   ```json
   {
     "data": { "id": "...", "name": "...", "_links": { "self": { "href": "/canteens/ID", "method": "GET" } } },
     "status": { "code": 200, "message": "..." },
     "pagination": {}
   }
   ```

3. **⚠️ Criação de cantina (`POST /canteens`) virou assíncrona.** A resposta retorna a cantina imediatamente com **`sellerId: null`** — o usuário SELLER é criado em segundo plano (mensageria) em ~instantes e o `sellerId` é preenchido depois. Se a tela precisa exibir o vendedor logo após criar, faça um `GET /canteens/:id` em seguida (ou um pequeno polling). O login do SELLER funciona normalmente assim que ele é criado.

4. **JWT com mais claims (transparente).** O token agora carrega `name`, `institutionId` e `canteenId` além de `sub/email/role`. O frontend não precisa mudar nada; se decodificar o token, só há campos a mais.

5. **Códigos HTTP / contrato de erro:** inalterados. Continua `201` em criação, `200` em leitura/edição, `204`/sem corpo em remoção, e erros no mesmo envelope com `status.code` e `status.message`.

6. **Adicionais no carrinho (nuance herdada):** ao adicionar item com adicionais, o item do carrinho guarda os adicionais por snapshot e, por ora, **nome/preço do adicional podem vir vazios** no `GET /cart` (não há ainda projeção de extras no serviço de pedidos). O `extraId` é preservado. Evolução prevista: emitir projeção de `extras` para preencher esses campos.

## 4. Checklist de migração do frontend
- [ ] Trocar a base URL do cliente HTTP para `https://apps-gateway.6x97ra.easypanel.host`.
- [ ] (Opcional) Tolerar/usar o campo `_links` nas respostas.
- [ ] Ajustar o fluxo de criação de cantina para não depender de `sellerId` na resposta imediata.
- [ ] Reusar todo o resto sem alterações (paths, bodies, headers, `Authorization: Bearer <token>`).
