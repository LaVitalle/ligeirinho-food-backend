# Contrato de Resposta Padrão

Toda resposta da API segue o mesmo formato, seja sucesso ou erro.

## Estrutura

```json
{
  "data": {},
  "status": {
    "code": 200,
    "message": "Mensagem descritiva"
  },
  "pagination": {}
}
```

| Campo | Tipo | Descrição |
|---|---|---|
| `data` | `object \| array` | Dados retornados. Em caso de erro, sempre `[]` |
| `status.code` | `number` | HTTP status code |
| `status.message` | `string` | Mensagem amigável para o usuário |
| `pagination` | `object` | Dados de paginação. Vazio `{}` em rotas sem paginação |

---

## Decorators

### `@ResponseMessage(message)`

Define a mensagem de sucesso que será retornada no campo `status.message`.
Se não for usado, o valor padrão é `"Success"`.

**Arquivo:** `@shared/infra/decorators/response-message.decorator`

**Uso no controller:**

```typescript
import { ResponseMessage } from "@shared/infra/decorators/response-message.decorator";

@Controller("restaurants")
export class RestaurantsController {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Post()
  @ResponseMessage("Restaurante criado com sucesso")
  async create(@Body() dto: CreateRestaurantDto) {
    return this.restaurantService.create(dto);
  }

  @Get(":id")
  @ResponseMessage("Restaurante encontrado")
  async findById(@Param("id") id: string) {
    return this.restaurantService.findById(id);
  }

  @Delete(":id")
  @ResponseMessage("Restaurante removido com sucesso")
  async delete(@Param("id") id: string) {
    return this.restaurantService.delete(id);
  }
}
```

**Resposta gerada:**

```json
{
  "data": { "id": "uuid", "name": "Pizzaria X" },
  "status": { "code": 201, "message": "Restaurante criado com sucesso" },
  "pagination": {}
}
```

---

### `@ApiWrappedResponse(Model)`

Decorator para o Swagger documentar o endpoint com o contrato de resposta padrão.

**Arquivo:** `@shared/infra/swagger/api-response.dto`

**Uso no controller:**

```typescript
import { ApiWrappedResponse } from "@shared/infra/swagger/api-response.dto";

@Get()
@ResponseMessage("Restaurantes listados com sucesso")
@ApiWrappedResponse(RestaurantDto, { isArray: true, description: "Lista de restaurantes" })
async findAll() {
  return this.restaurantService.findAll();
}

@Get(":id")
@ResponseMessage("Restaurante encontrado")
@ApiWrappedResponse(RestaurantDto, { description: "Restaurante por ID" })
async findById(@Param("id") id: string) {
  return this.restaurantService.findById(id);
}
```

**Parâmetros:**

| Parâmetro | Tipo | Padrão | Descrição |
|---|---|---|---|
| `model` | `Class` | — | DTO que representa o tipo de `data` |
| `isArray` | `boolean` | `false` | `true` se `data` for uma lista |
| `description` | `string` | — | Descrição do endpoint no Swagger |

---

## Tratamento de Erros

O `GlobalExceptionFilter` captura qualquer exceção e devolve no mesmo contrato.
Basta lançar exceções HTTP no service — o filter formata automaticamente.

### Exemplos no Service

```typescript
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

@Injectable()
export class RestaurantService {
  async findById(id: string) {
    const restaurant = await this.restaurantRepository.findById(id);

    if (!restaurant) {
      throw new NotFoundException("Restaurante não encontrado");
    }

    return RestaurantDto.from(restaurant);
  }

  async create(dto: CreateRestaurantDto) {
    const exists = await this.restaurantRepository.findByEmail(dto.email);

    if (exists) {
      throw new ConflictException("Já existe um restaurante com esse email");
    }

    // ...
  }
}
```

### Respostas de erro geradas

**404 — Não encontrado:**

```json
{
  "data": [],
  "status": { "code": 404, "message": "Restaurante não encontrado" },
  "pagination": {}
}
```

**409 — Conflito:**

```json
{
  "data": [],
  "status": { "code": 409, "message": "Já existe um restaurante com esse email" },
  "pagination": {}
}
```

**400 — Validação (class-validator):**

```json
{
  "data": [],
  "status": { "code": 400, "message": "name must be a string, email must be an email" },
  "pagination": {}
}
```

**500 — Erro inesperado:**

```json
{
  "data": [],
  "status": { "code": 500, "message": "Internal server error" },
  "pagination": {}
}
```

> Todos os erros são persistidos automaticamente na tabela `error_logs` com stack trace, path e method HTTP.

---

## Paginação

### Como funciona

A paginação usa a estratégia **limit + 1**: o repositório busca `perPage + 1` registros.
Se retornaram mais que `perPage`, existe próxima página. Não faz `COUNT` — é eficiente em qualquer volume de dados.

### Contrato paginado

```json
{
  "data": [ ... ],
  "status": { "code": 200, "message": "Success" },
  "pagination": { "page": 1, "perPage": 10, "hasNextPage": true }
}
```

| Campo | Tipo | Descrição |
|---|---|---|
| `page` | `number` | Página atual |
| `perPage` | `number` | Itens por página |
| `hasNextPage` | `boolean` | Se existe próxima página |

### Implementação passo a passo

**1. Repositório — busca `perPage + 1`**

```typescript
// src/modules/restaurants/infra/repositories/drizzle-restaurant.repository.ts

async findAll(page: number, perPage: number): Promise<PaginatedResult<Restaurant>> {
  const offset = (page - 1) * perPage;

  const rows = await this.drizzle.db
    .select()
    .from(restaurantsSchema)
    .limit(perPage + 1)
    .offset(offset);

  const restaurants = rows.map((row) =>
    Restaurant.restore({ id: row.id, name: row.name /* ... */ }),
  );

  return PaginatedResult.fromRows(restaurants, page, perPage);
}
```

`PaginatedResult.fromRows` recebe os rows, verifica se vieram mais que `perPage` e faz o corte automaticamente.

**2. Service — repassa o resultado**

```typescript
// src/modules/restaurants/application/services/restaurant.service.ts

async findAll(page: number, perPage: number): Promise<PaginatedResult<RestaurantDto>> {
  const result = await this.restaurantRepository.findAll(page, perPage);

  const dtos = result.items.map((r) => RestaurantDto.from(r));

  return PaginatedResult.fromRows(
    dtos,
    result.page,
    result.perPage,
  );
}
```

> Neste caso, como os items já foram cortados pelo repositório, `fromRows` recebe exatamente `perPage` items (ou menos na última página), então `hasNextPage` refletirá corretamente o valor original. Alternativamente, passe o `PaginatedResult` direto e mapeie os items.

**3. Controller — recebe query params**

```typescript
// src/modules/restaurants/infra/controllers/restaurants.controller.ts

@Get()
@ResponseMessage("Restaurantes listados com sucesso")
@ApiWrappedResponse(RestaurantDto, { isArray: true })
async findAll(
  @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
  @Query("perPage", new DefaultValuePipe(10), ParseIntPipe) perPage: number,
) {
  return this.restaurantService.findAll(page, perPage);
}
```

**4. O `TransformInterceptor` detecta automaticamente**

O interceptor verifica se o retorno do controller é uma instância de `PaginatedResult`.
Se for, extrai `items` para `data` e monta o `pagination`. Se não for, retorna `pagination: {}`.

Nenhuma configuração extra é necessária.

### Requisição do frontend

```
GET /restaurants?page=1&perPage=10
GET /restaurants?page=2&perPage=10
```

### Lógica do frontend para navegação

```
- Botão "Próximo": habilitado quando hasNextPage === true
- Botão "Anterior": habilitado quando page > 1
```
