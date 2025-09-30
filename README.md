# MFO Planner — Frontend

Aplicação **Next.js (App Router)** para gestão de planejamento financeiro de Multi Family Office (MFO).
Este frontend consome a API do MFO Planner e oferece módulos de **Simulações**, **Projeções**, **Alocações**, **Movimentações** e **Seguros**, além de uma **Visão Geral** com KPIs e gráficos.

> Status: ativo em desenvolvimento (branch `feature/simulacoes-e-projecoes`).

---

## Qualidade do Código

- [Relatório SonarCloud - Backend](https://sonarcloud.io/project/overview?id=cilasmiguel-git_projeto_multi_family_office_backend)  
- [Relatório SonarCloud - Frontend](https://sonarcloud.io/project/overview?id=cilasmiguel-git_projeto_multi_family_office_frontend)

---

## ✨ Principais funcionalidades

- **Visão Geral do Cliente (Dashboard)**
  - KPIs (patrimônio projetado, % investido, % imobilizado)
  - Alternância de **situação de vida** (Vivo/Morto) que reprocessa a projeção
  - Gráfico de evolução (Recharts) com **ativos financeiros**, **imobilizados** e **total sem seguros**
  - Timeline de Alocações (registros ao longo dos anos)

- **Projeções**
  - Execução via hook `useRunProjection()` → endpoint `/projections`
  - Usa a simulação/versão corrente e o `lifeStatus` para recalcular
  - Persistência do último estado processado evitando reprocessos desnecessários

- **Simulações (com versões)**
  - Listagem das simulações do cliente (`/simulations?clientId=`)
  - **Gerenciamento de versões**: listar, criar (em branco ou a partir de outra), ramificar, editar e excluir
  - Histórico de versões com o componente `HistoryList`
  - Persistência do contexto: `localStorage.activeSimulationId`

- **Alocações**
  - CRUD de alocações por versão (`/allocations`)
  - Registros (records) por alocação e **histórico** consolidado
  - Visualização em timeline no dashboard

- **Movimentações**
  - CRUD por versão (`/movements`): tipo, valor, frequência, início e fim
  - Formulários em **Dialog** reutilizáveis

- **Seguros**
  - CRUD por versão (`/insurances`): tipo, início/duração, prêmio mensal e cobertura
  - Formulários em **Dialog** reutilizáveis

- **Discovery / Indicações**
  - Painel com **cartões fictícios** (Financeiras/Imobilizadas) que levam às páginas de criação
  - Útil para onboarding e fluxo guiado

- **UI refinada**
  - Componentes baseados em **shadcn/ui + Radix** (Button, Input, Select, Dialog, AlertDialog, Toast)
  - Ajustes visuais: focos, `cursor-pointer`, inputs e selects mais profissionais, dialogs centralizados
  - Sidebar dinâmica por cliente + logomarca com gradiente

---

## 🧱 Stack

- **Next.js** (App Router)
- **React 18 + TypeScript**
- **TanStack Query (React Query)** para cache/estado de dados
- **Tailwind CSS** (classes utilitárias + variáveis CSS do tema)
- **Radix UI** via **shadcn/ui** (Dialog, Select etc.) + **lucide-react** (ícones)
- **Recharts** (gráficos)

> Node recomendado: **>= 18**

---

## ⚙️ Configuração do ambiente

Crie um arquivo `.env.local` na raiz do projeto com a base URL da API:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3333
```

Caso existam outras variáveis no seu `src/lib/api.ts`, adicione-as aqui.

---

## ▶️ Como executar

```bash
# 1) Instalar dependências
npm install
# ou
pnpm install
# ou
yarn

# 2) Rodar em desenvolvimento
npm run dev

# 3) Acessar
http://localhost:3000
```

Outros scripts úteis (podem variar conforme seu package.json):

```bash
npm run build     # build de produção
npm run start     # iniciar produção (após build)
npm run lint      # lint do código
```

---

## 🧭 Estrutura (resumo)

```txt
src/
  app/
    (app)/
      clients/[id]/
        dashboard/page.tsx        # visão geral (KPIs, gráfico, timeline)
        projection/page.tsx       # execução/visualização de projeções
        simulations/page.tsx      # gestão de simulações e versões
        allocations/              # (rotas e telas de alocações)
        movements/                # (rotas e telas de movimentações)
        insurances/               # (rotas e telas de seguros)
    (app)/layout.tsx
    globals.css
    not-found.tsx
  components/
    SidebarNav.tsx
    HistoryList.tsx
    AllocationsTimelinePro.tsx
    DiscoveryPanel.tsx
    ui/
      button.tsx
      input.tsx
      select.tsx
      dialog.tsx
      alert-dialog.tsx
      use-toast.ts
  hooks/
    useSimulations.ts
    useProjections.ts
    useAllocations.ts
    useMovements.ts
    useInsurances.ts
    useClients.ts
  lib/
    api.ts          # axios/fetch client
    routes.ts       # mapeamento de endpoints
    keys.ts         # query keys do React Query
    utils.ts
```

---

## 🔌 API (mapeamento principal)

> Os endpoints abaixo estão refletidos em `src/lib/routes.ts` e consumidos pelos hooks em `src/hooks/*`.

### Simulações
- `GET /simulations?clientId=` — lista últimas simulações do cliente
- `POST /simulations` — cria simulação `{ clientId, name, baseRateReal }`
- `PATCH /simulations/{id}` — edita nome/taxa
- `DELETE /simulations/{id}` — remove simulação
- `GET /simulations/{id}/versions` — lista versões
- `POST /simulations/{id}/versions` — cria nova versão (`{ fromVersionId? }`)

### Projeções
- `POST /projections` — `{ simulationId, lifeStatus, baseRateReal? }`

### Alocações
- `GET /allocations/version/{versionId}`
- `POST /allocations` — `{ simulationVersionId, type, name }`
- `PATCH /allocations/{id}` — `{ name?, type? }`
- `DELETE /allocations/{id}`
- `GET /allocations/{id}/records`
- `POST /allocations/records` — `{ allocationId, date, value }`

### Movimentações
- `GET /movements/version/{versionId}`
- `POST /movements` — `{ simulationVersionId, type, amount, frequency, startDate, endDate? }`
- `PATCH /movements/{id}`
- `DELETE /movements/{id}`

### Seguros
- `GET /insurances/version/{versionId}`
- `POST /insurances` — `{ simulationVersionId, type, name, startDate, durationMonths, monthlyPremium, insuredAmount }`
- `PATCH /insurances/{id}`
- `DELETE /insurances/{id}`

---

## 🧠 Estado, cache e chaves

- **React Query** centraliza o cache; as chaves vêm de `src/lib/keys.ts`
- Invalidações estratégicas após `mutations` garantem que a UI atualize imediatamente
- Contexto de navegação:
  - `localStorage.activeClientId` — cliente ativo para a sidebar/dashboard
  - `localStorage.activeSimulationId` — simulação ativa para módulos por versão

---

## 🧩 Componentes de UI (shadcn + Radix)

- **Button**: variantes, `cursor-pointer` no hover
- **Input**: foco aprimorado, sombras sutis, melhor legibilidade
- **Select**: trigger e content estilizados, acessíveis
- **Dialog**: centralizado, foco/esc, close via `X` e `DialogFooter` com ações à direita
- **AlertDialog** e **Toast**: feedback consistente para CRUDs

---

## 🗺️ Fluxos em alto nível

- **Criar Simulação** → (opcional) **Criar Versão** → **Rodar Projeção**  
- **Adicionar Alocações** + **Registros** → aparecem na **Timeline** e impactam projeção  
- **Criar Movimentações** e **Seguros** → impactam projeção e listagens
- **Descobrir Produtos** (fictícios) → atalhos para telas de criação

---

## 🧪 Convenções de commit (sugestão)

Adotar **Conventional Commits** facilita reviews e changelogs:

```
feat(simulacoes): gerenciamento de versões (criar/ramificar/editar/excluir)
ui: inputs/selects mais profissionais; dialog centralizado
chore: rotas/keys atualizadas; remoção de páginas legadas
```

---

## 🐞 Dicas de debug

- Verifique `NEXT_PUBLIC_API_BASE_URL` no `.env.local`
- Use `Network` no DevTools para validar payloads dos hooks (React Query)
- Se o gráfico não renderizar, confirme os números na projeção e se há pontos

---

## 📌 Roadmap curto

- Modo offline para Discovery (mock service worker)
- Exportar relatórios (PDF/CSV)
- Permissões/Perfis (multi-usuários)
- Testes e2e


