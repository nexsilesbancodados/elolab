

# Plano: Suíte de Testes Completa para EloLab SaaS

## Visão Geral

Configurar infraestrutura completa de testes (unitários, integração, E2E, segurança RLS) e CI/CD, sem alterar componentes ou lógica existente.

---

## ETAPA 1 — Dependências e Configuração

**Instalar pacotes:**
- `@testing-library/user-event`, `msw`, `@playwright/test` (os demais já existem)

**Arquivos de configuração:**
- Atualizar `package.json` com scripts `test:run`, `test:e2e`, `test:e2e:ui`
- Manter `vitest.config.ts` existente (já correto)
- Criar `playwright.config.ts` com baseURL `http://localhost:5173`, timeout 30s, 1 retry, screenshot/video on failure, apenas chromium

---

## ETAPA 2 — Testes Unitários

**`src/lib/__tests__/formatters.test.ts`** — Testar todas as funções: `formatCPF`, `formatCNPJ`, `formatPhone`, `formatCEP`, `formatCurrency`, `formatDate`, `formatTime` com edge cases (strings vazias, valores inválidos, limites)

**`src/lib/__tests__/utils.test.ts`** — Testar `cn()` com classes conflitantes e vazias

**`src/hooks/__tests__/useFormValidation.test.ts`** — Renderizar hook com `renderHook`, testar `required`, `minLength`, `maxLength`, `pattern`, `custom` validators

**`src/hooks/__tests__/useFormState.test.ts`** — Testar estado inicial, `handleChange`, `reset`

**`src/components/__tests__/SupabaseProtectedRoute.test.tsx`** — Mockar `useSupabaseAuth`, testar: sem user → redirect `/auth`; sem roles → tela pendente; com role errada → acesso negado; com role correta → renderiza children

**`src/components/__tests__/ErrorBoundary.test.tsx`** — Testar que captura erro e exibe fallback

**`src/components/__tests__/EmptyState.test.tsx`** — Testar renderização com props

---

## ETAPA 3 — Testes de Integração com MSW

**`src/mocks/handlers.ts`** — Handlers REST interceptando `https://gebygucrpipaufrlyqqj.supabase.co/rest/v1/*` para tabelas `pacientes`, `agendamentos`, `medicos`

**`src/mocks/server.ts`** — Setup MSW com `setupServer(...handlers)`

**`src/test/setup.ts`** — Adicionar `beforeAll/afterAll/afterEach` do MSW server

**`src/components/__tests__/PatientListIntegration.test.tsx`** — Testar:
1. GET retorna lista → cards renderizam
2. POST cria registro → item aparece
3. DELETE remove → item desaparece
4. Status 500 → mensagem de erro exibida

---

## ETAPA 4 — Testes E2E com Playwright

**`tests/auth.spec.ts`** — Login válido, senha errada, redirect sem auth, logout

**`tests/crud.spec.ts`** — Criar/editar/deletar registro, validação de formulário vazio

**`tests/navigation.spec.ts`** — Todas as rotas do menu carregam, 404, responsividade mobile/desktop

**`tests/ui.spec.ts`** — Sem erros de console, loading states, empty states

---

## ETAPA 5 — Testes RLS

**`tests/rls.spec.ts`** — Usando fetch direto à API REST do Supabase:
1. Sem auth header → 0 registros
2. User A não lê dados de User B
3. User A não atualiza registro de User B
- Usar credenciais de teste e cleanup com `delete`

---

## ETAPA 6 — GitHub Actions CI/CD

**`.github/workflows/test.yml`**:
- Trigger: push `dev`, PR `main`
- Node 20, `npm ci`
- `npm run test:run` (Vitest)
- `npx playwright install --with-deps chromium`
- `npm run test:e2e`
- Secrets: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

---

## ETAPA 7 — TEST_PLAN.md

Documento na raiz listando todos os arquivos, comandos, cobertura esperada e instruções de secrets do GitHub.

---

## Arquivos a criar/modificar

| Ação | Arquivo |
|------|---------|
| Modificar | `package.json` (scripts) |
| Modificar | `src/test/setup.ts` (MSW) |
| Criar | `playwright.config.ts` |
| Criar | `src/mocks/handlers.ts` |
| Criar | `src/mocks/server.ts` |
| Criar | `src/lib/__tests__/formatters.test.ts` |
| Criar | `src/lib/__tests__/utils.test.ts` |
| Criar | `src/hooks/__tests__/useFormValidation.test.ts` |
| Criar | `src/hooks/__tests__/useFormState.test.ts` |
| Criar | `src/components/__tests__/SupabaseProtectedRoute.test.tsx` |
| Criar | `src/components/__tests__/ErrorBoundary.test.tsx` |
| Criar | `src/components/__tests__/EmptyState.test.tsx` |
| Criar | `src/components/__tests__/PatientListIntegration.test.tsx` |
| Criar | `tests/auth.spec.ts` |
| Criar | `tests/crud.spec.ts` |
| Criar | `tests/navigation.spec.ts` |
| Criar | `tests/ui.spec.ts` |
| Criar | `tests/rls.spec.ts` |
| Criar | `.github/workflows/test.yml` |
| Criar | `TEST_PLAN.md` |

Nenhum componente, página ou estilo existente será alterado.

