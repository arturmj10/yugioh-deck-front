# YugiohDeck — Frontend

> SPA para gerenciamento de decks de Yu-Gi-Oh!, construída com **React 19**, **Vite** e autenticação via **Keycloak** (OpenID Connect / PKCE).

---

## Sumário

- [Visão Geral](#visão-geral)
- [Stack Tecnológica](#stack-tecnológica)
- [Arquitetura](#arquitetura)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Configuração & Instalação](#configuração--instalação)
- [Executando o Projeto](#executando-o-projeto)
- [Rotas](#rotas)
- [Autenticação](#autenticação)
- [Contextos](#contextos)
- [Serviços](#serviços)
- [Componentes](#componentes)
- [Decisões de Arquitetura](#decisões-de-arquitetura)

---

## Visão Geral

O YugiohDeck Frontend permite que jogadores autenticados criem e gerenciem seus decks de Yu-Gi-Oh!. A interface integra com o backend ASP.NET Core para persistência e com a [API pública YGOProDeck](https://db.ygoprodeck.com/api-guide/) diretamente para busca de cartas em tempo real.

**Funcionalidades principais:**

- Login via Keycloak com fluxo Authorization Code + PKCE (sem client secret)
- Listagem, criação, edição e exclusão de decks com tema visual personalizável
- Deck Builder com catálogo de cartas pesquisável, drag-and-drop e suporte a Main / Extra / Side Deck
- Contagem de cartas por deck carregada em segundo plano
- Alternância de tema claro / escuro com persistência em `localStorage`
- Notificações de feedback via react-toastify

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| Framework | React 19 |
| Build Tool | Vite 8 |
| Roteamento | React Router DOM 7 |
| Autenticação OIDC | oidc-client-ts 3 |
| Notificações | react-toastify 11 |
| Ícones | lucide-react |
| Estilos | CSS customizado + variáveis CSS (temas) |
| Linting | ESLint 9 |
| API de Cartas | [YGOProDeck API v7](https://db.ygoprodeck.com/api-guide/) (pública, direto do browser) |
| API de Decks | Backend ASP.NET Core (autenticado) |

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (SPA)                        │
│                                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ AuthContext │  │ ThemeContext  │  │ React Router  │  │
│  │  (OIDC)    │  │ (light/dark) │  │   (rotas)     │  │
│  └──────┬──────┘  └──────────────┘  └───────┬───────┘  │
│         │                                   │          │
│  ┌──────▼───────────────────────────────────▼───────┐  │
│  │                     App.jsx                      │  │
│  │        ProtectedRoute → Layout → Pages           │  │
│  └──────┬──────────────────────────┬───────────────┘  │
│         │                          │                   │
│  ┌──────▼──────┐          ┌────────▼──────────┐        │
│  │  DecksPage  │          │ DeckDetalhesPage   │        │
│  │  (listagem) │          │  (deck builder)    │        │
│  └──────┬──────┘          └────────┬──────────┘        │
│         │                          │                   │
│  ┌──────▼──────────────────────────▼──────────────┐    │
│  │               deckService.js                   │    │
│  └──────┬───────────────────────────┬─────────────┘    │
└─────────│───────────────────────────│──────────────────┘
          │                           │
          ▼                           ▼
  ┌───────────────┐         ┌──────────────────┐
  │  Backend API  │         │  YGOProDeck API  │
  │  :5282/api    │         │  (pública, CORS) │
  │  (JWT Bearer) │         │                  │
  └───────┬───────┘         └──────────────────┘
          │
          ▼
  ┌───────────────┐
  │   Keycloak    │
  │  :8081 (OIDC) │
  └───────────────┘
```

### Fluxo de autenticação

1. O browser acessa uma rota protegida → `ProtectedRoute` detecta que não há sessão
2. `LoginPage` chama `login()` → `signinRedirect()` redireciona para o Keycloak com `state` e `code_challenge` (PKCE)
3. O usuário autentica no Keycloak → redirecionado para `/callback?code=...&state=...`
4. `AuthCallback` chama `signinRedirectCallback()` → `oidc-client-ts` valida o `state`, troca o `code` pelo `access_token` e armazena na `sessionStorage`
5. O evento `userLoaded` atualiza o `AuthContext` → `isLoading` vira `false` com `user` preenchido
6. Navegação automática para `/decks`

---

## Estrutura do Projeto

```
yugioh-deck-front/
├── public/
│   └── logo-yugioh.png               # Logo exibido no header
│
├── src/
│   ├── auth/
│   │   └── keycloak.js               # Instância do UserManager (oidc-client-ts)
│   │
│   ├── contexts/
│   │   ├── AuthContext.jsx            # Estado global de autenticação
│   │   └── ThemeContext.jsx           # Estado global de tema (light/dark)
│   │
│   ├── hooks/
│   │   └── useAuth.js                 # Atalho para consumir o AuthContext
│   │
│   ├── services/
│   │   └── deckService.js             # Todas as chamadas HTTP (backend + YGOProDeck)
│   │
│   ├── components/
│   │   ├── auth/
│   │   │   ├── AuthCallback.jsx       # Processa o retorno do Keycloak (/callback)
│   │   │   └── LoginPage.jsx          # Tela intermediária de redirecionamento
│   │   │
│   │   ├── decks/
│   │   │   ├── DecksPage.jsx          # Listagem, criação e edição de decks
│   │   │   ├── Decks.css
│   │   │   ├── DeckDetalhesPage.jsx   # Deck Builder (catálogo + slots)
│   │   │   └── DeckDetalhes.css
│   │   │
│   │   ├── layout/
│   │   │   ├── Layout.jsx             # Header com avatar, tema e logout
│   │   │   └── Layout.css
│   │   │
│   │   └── ui/
│   │       ├── ConfirmDialog.jsx      # Modal de confirmação reutilizável
│   │       ├── Modal.jsx              # Wrapper de modal genérico
│   │       ├── Toast.jsx              # Componente de toast customizado
│   │       └── ToastContainer.jsx     # Container de toasts
│   │
│   ├── App.jsx                        # Definição de rotas + ProtectedRoute
│   ├── main.jsx                       # Entry point — providers globais
│   └── index.css                      # Variáveis CSS de tema globais
│
├── package.json
├── vite.config.js
└── README.md
```

---

## Pré-requisitos

| Ferramenta | Versão mínima |
|-----------|---------------|
| Node.js | 18.x |
| npm | 9.x |
| Backend YugiohDeck API | rodando em `localhost:5282` |
| Keycloak | rodando em `localhost:8081` |

> O backend e o Keycloak são levantados via `docker compose up -d` na raiz do monorepo. Consulte o README do backend para instruções.

---

## Configuração & Instalação

### 1. Instale as dependências

```bash
cd yugioh-deck-front
npm install
```

### 2. Verifique as constantes de configuração

As URLs de backend e Keycloak estão definidas diretamente no código (sem `.env` por ora):

| Arquivo | Constante | Valor padrão |
|---------|-----------|--------------|
| `src/services/deckService.js` | `API_URL` | `http://localhost:5282/api` |
| `src/auth/keycloak.js` | `KEYCLOAK_URL` | `http://localhost:8081` |
| `src/auth/keycloak.js` | `REALM` | `yugioh-realm` |
| `src/auth/keycloak.js` | `CLIENT_ID` | `yugioh-app` |

Se alterar as portas do Docker, atualize essas constantes.

### 3. Configuração necessária no Keycloak

O client `yugioh-app` precisa estar configurado como:

| Campo | Valor |
|-------|-------|
| Client type | `Public` |
| Valid redirect URIs | `http://localhost:5173/*` |
| Valid post logout redirect URIs | `http://localhost:5173/*` |
| Web origins | `http://localhost:5173` |

---

## Executando o Projeto

```bash
npm run dev
```

A aplicação estará disponível em **`http://localhost:5173`**.

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia o servidor de desenvolvimento com HMR |
| `npm run build` | Gera o bundle de produção em `dist/` |
| `npm run preview` | Serve o bundle de produção localmente |
| `npm run lint` | Executa o ESLint |

---

## Rotas

| Rota | Componente | Acesso | Descrição |
|------|-----------|--------|-----------|
| `/login` | `LoginPage` | Público | Redireciona para o Keycloak |
| `/callback` | `AuthCallback` | Público | Processa o retorno OIDC |
| `/` | — | Protegido | Redireciona para `/decks` |
| `/decks` | `DecksPage` | Protegido | Inventário de decks do usuário |
| `/decks/:id` | `DeckDetalhesPage` | Protegido | Deck Builder |

Rotas protegidas são envolvidas em `ProtectedRoute`, que exibe um loading enquanto o `AuthContext` inicializa e redireciona para `/login` se não houver sessão ativa.

---

## Autenticação

A autenticação segue o fluxo **Authorization Code + PKCE** via `oidc-client-ts`, o padrão recomendado para SPAs públicos (sem client secret).

### `src/auth/keycloak.js`

Exporta uma instância singleton do `UserManager` com as seguintes configurações:

| Parâmetro | Valor | Descrição |
|-----------|-------|-----------|
| `authority` | `http://localhost:8081/realms/yugioh-realm` | Descoberta automática via `.well-known/openid-configuration` |
| `client_id` | `yugioh-app` | Client público no Keycloak |
| `redirect_uri` | `{origin}/callback` | URL de retorno após login |
| `post_logout_redirect_uri` | `{origin}/login` | URL de retorno após logout |
| `scope` | `openid profile email` | Claims solicitados |
| `response_type` | `code` | Fluxo Authorization Code |
| `userStore` | `sessionStorage` | Persiste a sessão na aba; limpa ao fechar |
| `automaticSilentRenew` | `true` | Renova o token antes de expirar via iframe |

### `AuthContext`

Gerencia o estado global de autenticação e expõe via `useAuth()`:

| Valor | Tipo | Descrição |
|-------|------|-----------|
| `user` | `User \| null \| undefined` | `undefined` = inicializando; `null` = não autenticado |
| `token` | `string \| null` | Access token JWT para o header `Authorization` |
| `userName` | `string` | Nome do usuário (`name` ou `preferred_username` do token) |
| `userInitial` | `string` | Primeira letra do nome (usada no avatar) |
| `isLoading` | `boolean` | `true` enquanto a sessão não foi verificada |
| `login()` | `() => void` | Inicia o fluxo PKCE |
| `logout()` | `async () => void` | Limpa sessão local e redireciona para o Keycloak |

**Tratamento do callback OIDC:** quando a URL contém `?code=&state=`, o `AuthContext` aguarda o evento `userLoaded` (disparado pelo `AuthCallback`) em vez de chamar `getUser()` imediatamente — evitando que `isLoading` vire `false` antes do token ser processado e causando redirect prematuro para `/login`.

---

## Contextos

### `AuthContext`
Detalhado na seção [Autenticação](#autenticação).

### `ThemeContext`

Gerencia o tema da interface. Expõe:

| Valor | Tipo | Descrição |
|-------|------|-----------|
| `theme` | `'light' \| 'dark'` | Tema atual |
| `toggleTheme()` | `() => void` | Alterna entre claro e escuro |

O tema é persistido em `localStorage` com a chave `@YgoDeck:theme` e aplicado via atributo `data-theme` no `<html>`, permitindo que o CSS use variáveis condicionais sem re-renderizações React.

---

## Serviços

### `src/services/deckService.js`

Centraliza todas as chamadas HTTP. Funções que acessam o backend recebem `token` e enviam `Authorization: Bearer <token>`. Qualquer `401` lança `new Error('SESSION_EXPIRED')`, tratado pelos componentes chamadores.

#### Funções — Backend (`localhost:5282`)

| Função | Método | Endpoint | Descrição |
|--------|--------|----------|-----------|
| `getDecks(token, nome?, formato?)` | GET | `/api/decks` | Lista decks do usuário com filtros opcionais |
| `getDeckById(id, token)` | GET | `/api/decks/:id` | Retorna deck completo com cartas |
| `criarDeck(deck, token)` | POST | `/api/decks` | Cria novo deck |
| `atualizarDeck(deck, token)` | PUT | `/api/decks/:id` | Atualiza nome, descrição e configuração |
| `deletarDeck(id, token)` | DELETE | `/api/decks/:id` | Remove o deck |
| `adicionarCartaAoDeck(deckId, cardId, slot, quantidade, token)` | POST | `/api/decks/:id/cards` | Adiciona carta ao deck |
| `removerCartaDoDeck(deckId, cardId, slot, token)` | DELETE | `/api/decks/:id/cards/:cardId` | Remove uma cópia da carta |

#### Funções — YGOProDeck API (pública, sem autenticação)

| Função | Descrição |
|--------|-----------|
| `buscarCartasComFiltros(texto, filtros, offset?)` | Busca cartas diretamente na API pública com paginação |

**Estratégia de busca em `buscarCartasComFiltros`:**

| Caso | Comportamento |
|------|---------------|
| Subtipo específico (ex: Fusão) | 1 chamada com `type=Fusion Monster` |
| Pêndulo | 2 chamadas em paralelo (Effect + Normal Pendulum) |
| Magias sem subtipo | 6 chamadas em paralelo (uma por tipo de magia) |
| Armadilhas sem subtipo | 3 chamadas em paralelo (uma por tipo de armadilha) |
| Monstros com race / attribute / level | 1 chamada com parâmetros diretos da API |

---

## Componentes

### `LoginPage`

Tela intermediária exibida enquanto o redirecionamento para o Keycloak acontece. Detecta automaticamente se o usuário já está autenticado e redireciona direto para `/decks` sem iniciar um novo fluxo de login.

### `AuthCallback`

Renderizado em `/callback`. Chama `signinRedirectCallback()` exatamente uma vez (protegido por `useRef` contra dupla execução no React StrictMode). Em caso de sucesso navega para `/decks`; em caso de erro redireciona para `/login`.

### `Layout`

Header global presente em todas as rotas protegidas. Exibe:
- Logo com link para `/decks`
- Nome do usuário extraído do token JWT
- Avatar com a inicial do nome
- Botão de alternância de tema (☀️ / 🌚)
- Botão de logout (⏻)

### `DecksPage`

Inventário de decks do usuário. Funcionalidades:
- Grid de cards com imagem de capa, nome, formato, cor de tema e contagem de cartas
- Filtros por nome (debounce 500ms) e formato (TCG / OCG / GOAT)
- Modal de criação com nome, descrição, formato e seleção de cor de tema
- Edição via o mesmo modal
- Exclusão com confirmação via `ConfirmDialog`
- Contagem de cartas carregada em segundo plano via `getDeckById` em paralelo (o endpoint de listagem não retorna `deckCards`)

### `DeckDetalhesPage`

Deck Builder completo. Funcionalidades:
- Catálogo de cartas com busca por texto (debounce 400ms) e paginação
- Resultados padrão ao abrir (sem precisar digitar)
- Adição por clique esquerdo ou drag-and-drop para Main / Extra / Side Deck
- Remoção por clique direito no deck
- Arrastar carta entre slots (Main ↔ Extra ↔ Side)
- Inspecionar carta (clique direito no catálogo) abre modal com detalhes
- Contadores por slot (ex: `42/60`)
- Edição de metadados do deck via modal (botão **✎ Editar** no header)
- Exclusão do deck com confirmação (botão **🗑 Excluir** no header)

### `ConfirmDialog`

Modal de confirmação reutilizável que substitui `window.confirm`.

| Prop | Tipo | Descrição |
|------|------|-----------|
| `isOpen` | `boolean` | Controla visibilidade |
| `onClose` | `() => void` | Chamado ao cancelar |
| `onConfirm` | `() => void` | Chamado ao confirmar |
| `title` | `string` | Título do modal |
| `message` | `string` | Mensagem de confirmação |

---

## Decisões de Arquitetura

### Por que `oidc-client-ts` em vez de uma biblioteca de componentes React?
Controle total sobre o fluxo OIDC sem abstrações desnecessárias. A biblioteca gerencia PKCE, armazenamento seguro do token e renovação automática (silent renew via iframe) sem impor uma estrutura de componentes.

### Por que `sessionStorage` e não `localStorage` para o token?
`sessionStorage` é isolado por aba e limpo ao fechar o browser, reduzindo a janela de exposição do token em caso de XSS. Cada aba mantém sua própria sessão independente.

### Por que o `AuthContext` aguarda o evento `userLoaded` na URL de callback?
Se `getUser()` retornar `null` enquanto `signinRedirectCallback()` ainda está trocando o `code` pelo token, `isLoading` vira `false` com `user = null`, causando redirect imediato para `/login` — um loop infinito de autenticação. Detectar `?code=&state=` na URL e aguardar o evento `userLoaded` resolve essa race condition.

### Por que a busca de cartas vai direto para a YGOProDeck API sem passar pelo backend?
O backend expõe apenas `GET /api/cards/search?q=` (busca por nome). Para buscar por raça, atributo, nível e tipo de carta, a YGOProDeck API oferece parâmetros nativos (`race`, `attribute`, `level`, `type`). Chamar diretamente evita replicar esses parâmetros no backend, reduz latência e não exige autenticação (API pública com suporte a CORS).

### Por que a contagem de cartas na listagem faz N requests paralelos?
O endpoint `GET /api/decks` não inclui `deckCards` por design (resposta leve para listagem). A contagem é carregada em segundo plano via `Promise.all` sobre `getDeckById`, atualizando cada card conforme a resposta chega — sem bloquear a exibição inicial da lista.

### Por que CSS customizado com variáveis em vez de classes utilitárias do Tailwind?
O projeto usa variáveis CSS globais (`--bg-panel`, `--text-main`, etc.) condicionadas ao atributo `data-theme` no `<html>`. Isso permite trocar o tema inteiro com uma única mudança de atributo, sem re-renderizações React e sem duplicar classes por componente.
