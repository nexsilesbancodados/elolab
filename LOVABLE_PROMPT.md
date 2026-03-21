# PROMPT PARA LOVABLE - CORREÇÃO E MELHORIA COMPLETA DO APP ELOLAB

> Copie e cole este prompt no Lovable para ele executar todas as correções e melhorias.

---

## PROMPT:

Preciso que você faça uma auditoria completa e corrija TODOS os problemas do meu app EloLab. Vou listar cada problema encontrado com localização exata. Corrija TUDO com máxima qualidade profissional.

---

### 🔴 PROBLEMAS CRÍTICOS (CORRIGIR PRIMEIRO)

#### 1. SEGURANÇA: Chaves API hardcoded
**Arquivo:** `src/integrations/supabase/client.ts` (linhas 5-6)
**Problema:** A chave do Supabase está hardcoded diretamente no código. Isso é uma falha grave de segurança.
**Correção:** Use apenas `import.meta.env.VITE_SUPABASE_URL` e `import.meta.env.VITE_SUPABASE_ANON_KEY`. Remova strings hardcoded. O arquivo deve ficar assim:

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and Anon Key must be provided in environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);
```

#### 2. TYPES: TypeScript muito permissivo
**Problema:** O app usa `any` em dezenas de lugares, escondendo bugs reais.
**Arquivos com `any` que precisam de tipos corretos:**
- `src/pages/ContasPagar.tsx:153` - `const payload: any` → criar interface `ContaPagarPayload`
- `src/pages/Pagamentos.tsx:284` - `const payload: any` → criar interface `PagamentoPayload`
- `src/pages/Pacientes.tsx:568` - `const dataToSave: any` → criar interface `PacienteFormData`
- `src/pages/Laboratorio.tsx:160` - `const updates: any` → criar interface `LaboratorioUpdate`
- `src/pages/Configuracoes.tsx:199` - `const payload: any` → criar interface `ConfigPayload`
- `src/components/AuditLog.tsx` - `const filters: any` → criar interface `AuditFilters`
- `src/hooks/useSupabaseData.ts` - Remover todos os `as any`, criar types corretos

**Correção:** Para CADA arquivo acima, crie uma interface TypeScript adequada e substitua o `any`. Adicione as interfaces em `src/types/index.ts`.

---

### 🟡 PROBLEMAS DE FUNCIONALIDADE

#### 3. VALIDAÇÃO DE FORMULÁRIOS INEXISTENTE
**Problema:** Formulários aceitam qualquer dado sem validação. Dados inválidos vão para o banco.
**Arquivos afetados:**
- `src/pages/Pacientes.tsx` - Formulário de paciente: CPF não é validado, telefone não é validado, email não é validado, data de nascimento aceita datas futuras
- `src/pages/Prontuarios.tsx` - Dados clínicos sem validação
- `src/pages/Exames.tsx` - Dados de exame sem validação
- `src/pages/ContasPagar.tsx` - Valores financeiros sem validação
- `src/pages/ContasReceber.tsx` - Valores financeiros sem validação

**Correção:** Adicione validação com Zod (já está instalado no projeto) em TODOS esses formulários. Exemplo padrão:

```typescript
import { z } from 'zod';

const pacienteSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido').optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefone: z.string().min(10, 'Telefone inválido').optional().or(z.literal('')),
  data_nascimento: z.string().refine(d => !d || new Date(d) <= new Date(), 'Data não pode ser futura').optional(),
});
```

Aplique o mesmo padrão para TODOS os formulários do app. Mostre os erros de validação inline nos campos.

#### 4. TRATAMENTO DE ERROS RUIM
**Problema:** Quando APIs falham, o usuário não recebe feedback claro. Muitas chamadas ao Supabase não têm tratamento de erro.
**Correção para TODAS as páginas:**
- Envolva cada operação de banco (insert, update, delete) com try-catch
- Mostre toast de erro com mensagem clara usando `sonner` (já instalado)
- Adicione fallback visual quando dados não carregam
- NÃO use `console.log` para erros, use toast

Exemplo padrão para TODA operação:
```typescript
try {
  const { error } = await supabase.from('tabela').insert(dados);
  if (error) throw error;
  toast.success('Registro salvo com sucesso');
} catch (err) {
  toast.error('Erro ao salvar registro. Tente novamente.');
}
```

#### 5. LOADING STATES AUSENTES
**Problema:** Várias operações assíncronas não mostram indicador de carregamento.
**Correção:** Em TODAS as páginas, adicione:
- Skeleton loading quando dados estão carregando (use os componentes de `src/components/saas/feedback/LoadingStates.tsx`)
- Botões com estado de loading (disabled + spinner) durante submissão
- Estado vazio quando não há dados (use `src/components/saas/feedback/EmptyState.tsx`)

#### 6. PÁGINA LANDING PAGE NÃO FUNCIONA
**Arquivo:** `src/pages/LandingPage.tsx`
**Problema:** Apenas redireciona para `/dashboard`, não tem conteúdo real.
**Correção:** Implemente uma landing page completa usando os componentes SaaS em `src/components/saas/landing/`. Deve ter:
- HeroSection com título do EloLab, subtítulo, CTA para login
- FeaturesGrid com as features do sistema (agenda, prontuários, financeiro, etc)
- StatsSection com números do sistema
- TestimonialsSection
- PricingSection com os planos
- FAQSection com perguntas comuns
- CTASection final
- FooterSection

#### 7. CACHE DO REACT QUERY COM BUG
**Arquivo:** `src/hooks/useSupabaseData.ts:20`
**Problema:** `queryKey: [tableName, options]` - o objeto `options` muda referência a cada render, causando cache miss e chamadas excessivas à API.
**Correção:**
```typescript
queryKey: [tableName, JSON.stringify(options)]
```
Ou use `useMemo` para estabilizar as options.

---

### 🟡 PROBLEMAS DE CÓDIGO E QUALIDADE

#### 8. COMPONENTES ENORMES - PRECISAM SER DIVIDIDOS
**Problema:** Arquivos gigantes impossíveis de manter:
- `src/pages/Pacientes.tsx` → 1.680 linhas
- `src/pages/Prontuarios.tsx` → 1.491 linhas
- `src/pages/CaixaDiario.tsx` → 1.337 linhas
- `src/pages/Agenda.tsx` → 1.216 linhas

**Correção para cada um:**
- Extraia seções em componentes menores dentro de subpastas
- Mova lógica de negócios para hooks customizados
- Mova formulários para componentes separados
- Mova tabelas/listas para componentes separados

Exemplo para Pacientes.tsx:
```
src/pages/pacientes/
  ├── index.tsx (página principal, orquestrador)
  ├── PacienteForm.tsx (formulário)
  ├── PacienteTable.tsx (tabela/lista)
  ├── PacienteDetails.tsx (detalhes)
  ├── usePacienteForm.ts (hook do formulário)
  └── types.ts (tipos)
```

#### 9. CONSOLE.LOG EM PRODUÇÃO
**Remova TODOS os console.log destes arquivos:**
- `src/pages/Tarefas.tsx:242` - `console.log('Tarefas carregadas:', ...)`
- `src/pages/Agenda.tsx:144` - `console.log('WhatsApp notification skipped:', err)`
- `src/pages/Agenda.tsx:399` - `console.log('Reminder scheduling skipped:', e)`
- Qualquer outro `console.log` que encontrar

Substitua por tratamento adequado de erro com toast ou ignore silenciosamente.

#### 10. PDF COM DADOS HARDCODED
**Arquivo:** `src/lib/pdfGenerator.ts:14-18`
**Problema:** Nome, endereço, telefone e CNPJ da clínica estão hardcoded:
```typescript
const CLINICA = {
  nome: 'EloLab Clínica Médica',
  endereco: 'Av. Principal, 1000 - Centro - São Paulo/SP',
  telefone: '(11) 3000-0000',
  cnpj: '00.000.000/0001-00',
};
```
**Correção:** Receba os dados da clínica como parâmetro da função, buscando do contexto de auth/clinica do Supabase.

---

### 🟢 MELHORIAS DE UX/DESIGN

#### 11. INTEGRAR COMPONENTES SAAS NAS PÁGINAS
O projeto tem componentes SaaS premium em `src/components/saas/` que NÃO estão sendo usados. Integre-os:

- **Dashboard.tsx** → Use `WelcomeBanner`, `SaasStatsCard`, `KPIPanel`, `ActivityFeed`, `RevenueChart` no lugar dos componentes básicos atuais
- **Configuracoes.tsx** → Use `SettingsLayout` com variante sidebar para organizar as seções
- **Todas as páginas** → Use `EmptyState` quando não há dados, `SkeletonCard`/`SkeletonTable` durante loading
- **Todas as páginas** → Adicione animações com `FadeInUp`, `StaggerList` do `src/components/saas/animations/`

#### 12. MELHORAR RESPONSIVIDADE
- Teste TODAS as páginas em mobile (320px, 375px, 414px)
- Tabelas devem ter scroll horizontal em mobile
- Formulários devem empilhar em coluna única em mobile
- Sidebar deve fechar automaticamente em mobile após navegar
- Botões de ação devem ser full-width em mobile

#### 13. MELHORAR ACESSIBILIDADE
- Adicione `aria-label` em TODOS os botões de ícone (sem texto visível)
- Associe `<Label>` com `<Input>` usando `htmlFor`/`id` em todos os formulários
- Adicione `role="alert"` em mensagens de erro
- Garanta contraste mínimo 4.5:1 em todos os textos

#### 14. PERFORMANCE
- Todas as listas com mais de 50 itens devem ter paginação
- Use `React.memo` em componentes de lista que recebem as mesmas props
- Adicione `loading="lazy"` em todas as imagens
- Use `Suspense` com fallback de skeleton nos lazy-loaded routes do App.tsx

---

### CHECKLIST FINAL DE QUALIDADE

Depois de corrigir tudo acima, verifique que:

- [ ] `npm run build` roda sem erros
- [ ] `npm run lint` roda sem warnings
- [ ] Nenhum `console.log` em código de produção
- [ ] Nenhum `any` no TypeScript
- [ ] Todos os formulários têm validação com Zod
- [ ] Todas as operações de banco têm tratamento de erro
- [ ] Todas as páginas têm loading state e empty state
- [ ] Todas as tabelas têm paginação
- [ ] Todos os botões de ícone têm `aria-label`
- [ ] App funciona bem em mobile
- [ ] Componentes SaaS de `src/components/saas/` estão integrados
- [ ] Nenhuma chave API hardcoded no código

---

**IMPORTANTE:** Faça as correções na ordem apresentada (críticos primeiro). Cada seção deve ser completamente resolvida antes de passar para a próxima. Mostre-me o resultado de cada correção para eu validar.
