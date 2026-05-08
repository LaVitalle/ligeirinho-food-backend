# Processo de Desenvolvimento — Ligeirinho Food

Processo formal de execução de uma task do backlog. Cada fase tem **um agente especializado** responsável por executá-la — agentes não acumulam responsabilidades.

---

## Visão geral

```
┌────────────┐   ┌──────────┐   ┌─────────────┐   ┌──────────────┐
│ 1.         │ → │ 2.       │ → │ 3.          │ → │ 4.           │
│ Descoberta │   │ Análise  │   │ Planejamento│   │ Implementação│
└────────────┘   └──────────┘   └─────────────┘   └──────────────┘
                                                          │
                                                          ▼
                                                  ┌──────────────┐
                                                  │ 5.           │
                                                  │ Code Review  │ ◀─┐
                                                  └──────────────┘   │
                                                          │          │
                                                  REPROVADO ─────────┘
                                                          │
                                                  APROVADO ▼
                                                  ┌──────────────┐
                                                  │ 6.           │
                                                  │ Documentação │
                                                  └──────────────┘
                                                          │
                                                          ▼
                                                  ┌──────────────┐
                                                  │ 7.           │
                                                  │ Commit       │
                                                  └──────────────┘
```

---

## As 7 fases

| # | Fase | Agente | Pode escrever código? |
|---|------|--------|---|
| 1 | **Descoberta** | `task-discovery` | Não |
| 2 | **Análise** | `task-analysis` | Não |
| 3 | **Planejamento** | `task-planning` | Não |
| 4 | **Implementação** | `task-implementation` | Sim |
| 5 | **Code Review** | `architecture-reviewer` | Não (só aponta violações) |
| 6 | **Documentação** | `swagger-documenter` | Sim (apenas decorators/DTOs Swagger) |
| 7 | **Commit** | `commit-writer` | Não (só git) |

---

### 1. Descoberta — `task-discovery`

**Objetivo:** entender exatamente do que a task se trata antes de qualquer outra coisa.

**Input:** ID do backlog (ex.: `BE-06`) ou descrição livre.

**Output esperado:**
- Resumo (1-2 frases)
- Escopo (in / out)
- Atores afetados (ADMIN / SELLER / CUSTOMER)
- Pontos ambíguos — perguntas explícitas para o usuário
- Regras de negócio a definir antes de seguir

**Critério de saída:** todos os pontos ambíguos respondidos pelo usuário. Sem isso, **não avança**.

---

### 2. Análise — `task-analysis`

**Objetivo:** mapear no código atual o que será afetado pela implementação.

**Input:** output da Descoberta.

**Output esperado:**
- Módulos afetados (existentes ou novos)
- Arquivos afetados (paths com line numbers quando aplicável)
- Schema de banco (tabelas / colunas / FKs / índices)
- Endpoints novos ou alterados (método + path + role)
- Dependências cruzadas (outras tasks/módulos)
- Riscos (breaking changes, migrations destrutivas, regressões)
- Bibliotecas necessárias

**Critério de saída:** mapa completo do impacto, sem ambiguidade.

---

### 3. Planejamento — `task-planning`

**Objetivo:** apresentar trade-offs entre 2-3 abordagens e recomendar uma.

**Input:** outputs de Descoberta + Análise.

**Output esperado:**
- 2-3 modelos de implementação (descrição + prós + contras)
- Recomendação justificada
- Estrutura de pastas/arquivos proposta
- Ordem de implementação (schema → repo → service → controller → DTO → swagger)

**Critério de saída:** modelo aprovado pelo usuário.

---

### 4. Implementação — `task-implementation`

**Objetivo:** escrever o código seguindo rigorosamente o `CLAUDE.md`.

**Input:** plano aprovado.

**Output esperado:** código pronto para review (ainda não commitado).

**Princípios invioláveis:**
- DDD em 3 camadas (domain → application → infra)
- domain sem imports de framework
- controllers só delegam
- Symbol token para repositórios
- Padrão `restore()` + `withX()` em entidades
- `@ResponseMessage` + `@ApiWrappedResponse` em todo endpoint

**Critério de saída:** código compila, segue convenções, escopo respeitado.

---

### 5. Code Review — `architecture-reviewer`

**Objetivo:** validar conformidade arquitetural. **Não corrige** — aponta violações.

**Input:** código implementado.

**Output esperado:**
- Status: `APROVADO` ou `REPROVADO`
- Se reprovado: lista de violações com `file:line` e correção sugerida

**Critério de saída:** APROVADO. Se REPROVADO, **volta para a fase 4** (Implementação).

---

### 6. Documentação — `swagger-documenter`

**Objetivo:** garantir Swagger completo + estrutura HyperOAS nos endpoints novos/alterados.

**Input:** código aprovado.

**Output esperado:**
- Decorators Swagger completos em cada endpoint (`@ApiTags`, `@ApiOperation`, `@ApiBody`, `@ApiWrappedResponse`, etc.)
- DTOs com `@ApiProperty` em cada campo
- Campo `_links` (HyperOAS) no response quando aplicável

**Critério de saída:** abrir `/docs` e ver toda a feature documentada.

---

### 7. Commit — `commit-writer`

**Objetivo:** criar commit claro, organizado, **sem co-autor**, sem detalhes técnicos demais.

**Input:** alterações prontas.

**Output esperado:** commit criado.

**Regras inegociáveis:**
- NUNCA adicionar `Co-Authored-By:` ou rodapés similares
- Nunca usar `--no-verify`, `--amend` (a menos que o usuário peça)
- Nunca commitar `.env`, segredos, lockfiles fora do escopo
- Mensagem no padrão: `<tipo>(<escopo>): <resumo>` + 1-3 linhas explicando o **porquê**

**Tipos:** `feat`, `fix`, `docs`, `refactor`, `chore`, `test`.

---

## Como invocar

O orquestrador (Claude Code principal) chama os agentes em sequência. Cada agente roda em isolamento via `Agent` tool, recebendo o output da fase anterior como input.

**Pontos de pausa para o usuário:**
- Após Descoberta — confirmar escopo e regras de negócio.
- Após Planejamento — escolher modelo.
- Após Code Review reprovado — decidir se ajusta ou aceita débito técnico.

**Sem pausa explícita:** Análise, Implementação, Documentação, Commit fluem direto.

---

## Exemplo de execução (BE-06: Instituição com busca)

```
1. Descoberta:   "Busca por nome via ?search=. Filtro stateId/cityId fora de escopo."
2. Análise:      "Afeta InstitutionController, InstitutionService, DrizzleInstitutionRepository.
                  Sem schema. Risco baixo (regressão em listagem atual)."
3. Planejamento: "Opção A: ILIKE %x% no repo (recomendado). Opção B: pg_trgm + index GIN."
4. Implementação: <código escrito>
5. Code Review:  "APROVADO."
6. Documentação: "@ApiQuery search adicionado, @ApiProperty em InstitutionResponseDto."
7. Commit:       "feat(institutions): adiciona busca por nome na listagem"
```

---

## Agente legado

`ligeirinho-food-backend` — agente generalista pré-existente. Pode ser usado para **consultas ad-hoc fora do processo** (ex.: "esse padrão está correto?"), mas não substitui as 7 fases.
