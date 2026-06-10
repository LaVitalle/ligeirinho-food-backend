# Ligeirinho Food — Identity Service

Microsserviço de **identidade**: autenticação (JWT), usuários, instituições, localização (estados/cidades) e envio de e-mails.

- **Porta:** 4001 · **Banco:** `ligeirinho_identity` · **Swagger:** `/docs`

## Responsabilidade
- Login/registro, recuperação e reativação de conta (JWT com claims `sub, email, name, role, institutionId, canteenId`).
- CRUD de usuários (ADMIN/INSTITUTION_ADMIN), instituições e `access_code`.
- É o **dono** da tabela de usuários — único serviço que faz lookup no banco ao autenticar.

## Mensageria (RabbitMQ)
- **Consome** `canteen.created` (catalog) → cria o usuário SELLER → **publica** `seller.created`.
- **Consome** `order.created` / `order.status_changed` (orders) → envia e-mail ao cliente.

## Variáveis de ambiente
Ver [`.env.example`](.env.example): `PORT`, `DATABASE_URL`, `JWT_SECRET`, `RABBITMQ_URL`, `SWAGGER_ENABLED`, `SMTP_*`, `ADMIN_*`.

## Comandos
```bash
npm install
cp .env.example .env
npm run db:migrate        # aplica migrations
npm run db:seed:location  # estados e cidades (BR)
npm run db:seed:admin     # admin inicial
npm run start:dev         # desenvolvimento (watch)
npm run start:prod        # produção (dist/main.js)
npm run db:generate       # gera migration a partir dos schemas
npm run typecheck
```

## Docker
```bash
docker build -t ligeirinho-identity .
# em runtime roda: npm run db:migrate && npm run start:prod
```
