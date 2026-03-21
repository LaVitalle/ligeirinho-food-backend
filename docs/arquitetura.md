# Arquitetura do Projeto

API REST com **NestJS** seguindo **Clean Architecture + DDD**, organizada como **Modular Monolith**.

## Stack

| Tecnologia | Uso |
|---|---|
| NestJS 11.x | Framework HTTP |
| TypeScript (ES2023) | Linguagem |
| PostgreSQL | Banco de dados |
| Drizzle ORM 0.45.x | ORM / migrations |
| class-validator / class-transformer | Validação de DTOs |
| Biome | Linter e formatter |
| @nestjs/jwt + bcryptjs | Autenticação JWT |

---

## Estrutura de Pastas

```
src/
├── app.module.ts
├── main.ts
├── shared/
│   ├── shared.module.ts
│   ├── domain/enums/                ← enums compartilhados (Permission)
│   └── infra/
│       ├── database/
│       │   ├── drizzle.service.ts
│       │   └── drizzle/             ← migrations geradas
│       └── decorators/              ← @Public, @RequirePermissions, @CurrentUser
└── modules/
    └── <modulo>/
        ├── <modulo>.module.ts
        ├── domain/
        │   ├── models/              ← entidades de domínio
        │   └── repositories/        ← interfaces (contratos)
        ├── application/
        │   ├── services/            ← casos de uso
        │   └── dto/                 ← objetos de transferência
        └── infra/
            ├── controllers/         ← endpoints HTTP
            ├── repositories/        ← implementações com Drizzle
            └── schemas/             ← definições de tabelas
```

Módulos compostos podem agrupar submódulos (ex: `academic/` agrupa `students/`, `teachers/`, `subjects/`).

---

## Camadas

### Domain — camada mais interna, sem dependência de framework

**Entidade** — campos privados, getters, builders fluentes, factory `restore()`:

```typescript
export class Student {
  private readonly _id?: string;
  private _name: string;
  private readonly _createdAt?: Date;
  private readonly _updatedAt?: Date;

  private constructor(id?: string, createdAt?: Date, updatedAt?: Date) {
    this._id = id;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  get id() { return this._id; }
  get name() { return this._name; }

  withName(name: string): this { this._name = name; return this; }

  static restore(props?: { id?: string; name: string; createdAt?: Date; updatedAt?: Date }): Student | null {
    if (!props) return null;
    const s = new Student(props.id, props.createdAt, props.updatedAt);
    s._name = props.name;
    return s;
  }
}
```

**Interface de repositório** — contrato + Symbol token:

```typescript
export const STUDENT_REPOSITORY = Symbol("STUDENT_REPOSITORY");

export interface StudentRepository {
  create(student: Student): Promise<void>;
  findById(id: string): Promise<Student | null>;
  findAll(): Promise<Student[]>;
  update(student: Student): Promise<void>;
  delete(id: string): Promise<void>;
}
```

### Application — orquestra casos de uso, depende só de abstrações do domínio

**Service** — injeta repositório via token:

```typescript
@Injectable()
export class StudentService {
  constructor(
    @Inject(STUDENT_REPOSITORY)
    private readonly studentRepository: StudentRepository,
  ) {}

  async findById(id: string): Promise<StudentDto> {
    const student = await this.studentRepository.findById(id);
    if (!student) throw new NotFoundException("Aluno não encontrado");
    return StudentDto.from(student);
  }
}
```

**DTO** — construtor privado, factory `from()`:

```typescript
export class StudentDto {
  private constructor(public readonly name: string, public readonly email: string) {}

  static from(student: Student | null): StudentDto | null {
    if (!student) return null;
    return new StudentDto(student.name, student.email);
  }
}
```

### Infrastructure — código dependente de framework/banco

**Schema** (Drizzle):

```typescript
export const studentsSchema = pgTable("students", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});
```

**Controller** — delega tudo para o service, zero lógica de negócio.

**Repository impl** — implementa a interface do domínio usando `DrizzleService`.

---

## Injeção de Dependência

Tokens **Symbol** garantem que services dependam da abstração, não da implementação (DIP):

```typescript
// modulo.module.ts
providers: [
  StudentService,
  DrizzleStudentRepository,
  { provide: STUDENT_REPOSITORY, useExisting: DrizzleStudentRepository },
],
```

---

## Fluxo de uma Requisição

```
HTTP Request → Controller (infra) → Service (application) → Repository Interface (domain) → Drizzle Repository (infra) → PostgreSQL
```

---

## Banco de Dados

```typescript
// drizzle.config.ts
schema: "./src/modules/**/infra/schemas/*.ts"
out: "./src/shared/infra/database/drizzle"
dialect: "postgresql"
```

`DrizzleService` é singleton provido pelo `SharedModule`. Comandos: `npm run db:generate`, `db:migrate`, `db:push`, `db:studio`.

---

## Autenticação e Autorização (JWT)

### Fluxo

```
POST /auth/login → recebe accessToken (JWT com sub, email, permissions)
Request com Bearer token → JwtAuthGuard → PermissionsGuard → Controller
```

### Decorators compartilhados (`src/shared/infra/decorators/`)

- **`@Public()`** — marca rota como pública (sem autenticação)
- **`@RequirePermissions(Permission.X)`** — exige permissões específicas
- **`@CurrentUser()`** — injeta usuário autenticado no parâmetro do controller

### Enum de permissões (`src/shared/domain/enums/permission.enum.ts`)

Padrão `modulo:acao` — ex: `students:read`, `teachers:write`, `teachers:delete`.

### Guards globais (registrados via `APP_GUARD` no AuthModule)

1. **`JwtAuthGuard`** — valida token, popula `request.user`, respeita `@Public()`
2. **`PermissionsGuard`** — verifica permissões com `@RequirePermissions()`

### Entidade User

Campos: id, email, password (hash bcrypt), teacherId? (FK), permissions (string[]), timestamps. Mesmo padrão de entidade do domínio.

### AuthModule

```typescript
@Module({
  imports: [
    JwtModule.registerAsync({       // registerAsync para aguardar ConfigModule
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("JWT_SECRET"),
        signOptions: { expiresIn: "1d" },
      }),
    }),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },      // 1º roda
    { provide: APP_GUARD, useClass: PermissionsGuard },   // 2º roda
  ],
})
export class AuthModule {}
```

### AppModule — ordem de imports

```typescript
imports: [ConfigModule.forRoot(), SharedModule, UsersModule, AuthModule, /* demais módulos */]
```

### Uso nos controllers

```typescript
@Get()
@RequirePermissions(Permission.TEACHERS_READ)
async findAll() { ... }

@Get("me")
async getProfile(@CurrentUser() user: AuthenticatedUser) { ... }
```

> Rotas sem `@RequirePermissions` ainda exigem autenticação.
> Rotas com `@Public()` não exigem nada.

---

## Convenções de Nomenclatura

| Elemento | Convenção | Exemplo |
|---|---|---|
| Entidade | PascalCase | `Student` |
| DTO | PascalCase + `Dto` | `StudentDto` |
| Service | PascalCase + `Service` | `StudentService` |
| Controller | PascalCase + `Controller` | `StudentsController` |
| Repository interface | PascalCase + `Repository` | `StudentRepository` |
| Repository impl | `Drizzle` + PascalCase + `Repository` | `DrizzleStudentRepository` |
| Token DI | `UPPER_SNAKE_CASE` | `STUDENT_REPOSITORY` |
| Tabelas | snake_case plural | `students` |
| Colunas | snake_case | `created_at` |
| Path aliases | `@<modulo>/*` | `@shared/*` |

---

## Path Aliases

```json
"@shared/*"         → "src/shared/*"
"@academic/*"       → "src/modules/academic/*"
"@class-offering/*" → "src/modules/class-offering/*"
"@enrollment/*"     → "src/modules/enrollment/*"
"@attendance/*"     → "src/modules/attendance/*"
"@users/*"          → "src/modules/users/*"
"@auth/*"           → "src/modules/auth/*"
```
