# Ligeirinho Food — Backend API

API REST para o **Ligeirinho Food**, um sistema de delivery de alimentos desenvolvido como Projeto Integrador do 5° semestre.

Construído com **NestJS** seguindo **Clean Architecture + DDD**, organizado como **Modular Monolith**.

## Stack

| Tecnologia | Uso |
|---|---|
| NestJS 11 | Framework HTTP |
| TypeScript | Linguagem |
| PostgreSQL 17 | Banco de dados |
| Drizzle ORM | ORM e migrations |
| MinIO | Armazenamento de objetos (imagens) |
| JWT + bcrypt | Autenticação |

## Pré-requisitos

- [Node.js](https://nodejs.org/) >= 20
- [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/) (para ambiente de desenvolvimento)

## Configuração

1. Clone o repositório:

```bash
git clone <url-do-repositorio>
cd ligeirinho-food-backend
```

2. Instale as dependências:

```bash
npm install
```

3. Crie o arquivo de variáveis de ambiente a partir do exemplo:

```bash
mkdir -p envs
cp .env.example envs/.env.development
```

Edite `envs/.env.development` conforme necessário. Para produção, crie `envs/.env.production` com as credenciais reais.

## Desenvolvimento

### 1. Subir os serviços (PostgreSQL + MinIO)

```bash
docker compose up -d
```

Isso cria automaticamente:

| Serviço | Porta | Descrição |
|---|---|---|
| PostgreSQL | `5432` | Banco de dados |
| MinIO API | `9000` | Armazenamento de objetos |
| MinIO Console | `9001` | Painel web do MinIO |

O bucket `ligeirinho` é criado automaticamente na inicialização.

### 2. Rodar a aplicação

```bash
npm run dev
```

A API estará disponível em `http://localhost:3000`.

### Outros comandos de desenvolvimento

```bash
npm run dev:debug    # modo watch + debugger (porta 9229)
npm run db:generate  # gerar migrations do Drizzle
npm run db:migrate   # aplicar migrations
npm run db:push      # push direto no banco (sem migration)
npm run db:studio    # abrir Drizzle Studio
```

### Parar os serviços

```bash
docker compose down       # para e remove os containers
docker compose down -v    # para, remove containers e apaga os volumes (dados)
```

## Produção

1. Configure `envs/.env.production` com as variáveis de ambiente de produção (veja `.env.example` para referência).

2. Build e execução:

```bash
npm run build
npm run start:prod
```

## Variáveis de ambiente

| Variável | Descrição | Obrigatória |
|---|---|---|
| `PORT` | Porta da aplicação | Não (padrão: `3000`) |
| `DATABASE_URL` | Connection string do PostgreSQL | Sim |
| `JWT_SECRET` | Chave secreta para tokens JWT | Sim |
| `MINIO_SERVER_URL` | URL do servidor MinIO | Sim |
| `MINIO_ROOT_USER` | Usuário do MinIO | Sim |
| `MINIO_ROOT_PASSWORD` | Senha do MinIO | Sim |
| `MINIO_BUCKET` | Nome do bucket no MinIO | Sim |

A aplicação valida todas as variáveis obrigatórias na inicialização. Se alguma estiver ausente, o processo encerra imediatamente com uma mensagem de erro descritiva.

## Estrutura do Projeto

```
src/
├── app.module.ts
├── main.ts
├── shared/                        ← infraestrutura compartilhada
│   ├── shared.module.ts
│   ├── domain/enums/
│   └── infra/
│       ├── config/                ← validação de variáveis de ambiente
│       ├── database/drizzle/      ← migrations geradas
│       └── decorators/
└── modules/                       ← feature modules
    └── <modulo>/
        ├── domain/
        │   ├── models/            ← entidades de domínio
        │   └── repositories/      ← interfaces (contratos)
        ├── application/
        │   ├── services/          ← casos de uso
        │   └── dto/               ← objetos de transferência
        └── infra/
            ├── controllers/       ← endpoints HTTP
            ├── repositories/      ← implementações com Drizzle
            └── schemas/           ← definições de tabelas
```

Cada módulo segue o padrão de 3 camadas (domain → application → infra), isolando regras de negócio do framework e do banco de dados. Detalhes completos em [`docs/arquitetura.md`](docs/arquitetura.md).
