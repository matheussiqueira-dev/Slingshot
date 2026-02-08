# Slingshot 2.0

Jogo arcade estilo bubble shooter com física em `Canvas`, assistente tático em tempo real e leaderboard online, desenvolvido com foco em arquitetura limpa, UX/UI moderna, performance, segurança e mantenibilidade.

![Slingshot demo](client/assets/slingshot-demo.gif)

## Visão Geral

O Slingshot é um jogo para navegador com mecânica de mira por arraste, ricochete lateral e progressão por pressão de grade. Nesta versão, o projeto evoluiu de um frontend monolítico para uma solução fullstack modular:

- Frontend desacoplado em módulos de domínio, renderização, input, UI e serviços.
- Backend API versionada (`/api/v1`) para ranking com validação e segurança.
- Persistência de leaderboard com fallback local no cliente.
- Testes automatizados para contratos e regras críticas.

## Objetivos de Produto

- Melhorar retenção do usuário com feedback tático e competição por ranking.
- Garantir experiência fluida em desktop e mobile.
- Sustentar evolução futura sem regressões estruturais.

## Arquitetura e Decisões Técnicas

### Arquitetura Geral

- `client/`: aplicação web (HTML/CSS/JS modular, sem build obrigatório).
- `server/`: API REST Express com separação em camadas.
- `tests/`: testes unitários e de integração da API.

### Frontend (modular)

- `game-engine`: regras de jogo, física, pontuação, progressão, modo zen.
- `grid-service`: operações de grade hexagonal (clusters, bolhas flutuantes).
- `canvas-renderer`: renderização isolada do estado.
- `input-controller`: ponteiro + teclado com mapeamento para comandos do jogo.
- `ui-controller`: atualização de HUD, overlay, estados visuais e ranking.
- `leaderboard-service`: integração com API + fallback local resiliente.

### Backend (Clean-ish layering)

- `routes` -> `controller` -> `service` -> `repository`.
- `service` aplica regras/validação (`zod`).
- `repository` encapsula persistência em arquivo JSON.
- middlewares globais: `helmet`, `cors`, `rate-limit`, `request-id`, `error-handler`.

### Princípios Aplicados

- `SRP`: responsabilidades segmentadas por módulo.
- `DRY`: utilitários e contratos centralizados.
- `Separation of Concerns`: UI, domínio e infraestrutura desacoplados.
- `Fail-safe`: fallback local quando API está indisponível.

## Stack Tecnológica

- Frontend: HTML5, CSS3, JavaScript ES Modules, Canvas 2D.
- Backend: Node.js, Express, Zod, Helmet, CORS, Morgan, Express Rate Limit.
- Testes: Node Test Runner (`node:test`) + Supertest.

## Estrutura do Projeto

```text
client/
  assets/
  src/
    config/
    core/
    game/
    input/
    rendering/
    services/
    ui/
    utils/
  index.html
  styles.css

server/
  data/
    leaderboard.json
  src/
    config/
    middleware/
    modules/
      health/
      leaderboard/
    app.js
    index.js

tests/
  api.leaderboard.test.js
  leaderboard.service.test.js
```

## Melhorias Implementadas

### UX/UI e Frontend

- Redesign completo com design system (cores, raios, sombras, tipografia, componentes).
- Layout em 3 painéis com hierarquia clara: status, arena, assistente/ranking.
- Acessibilidade: landmarks, `aria-*`, foco visível e suporte a `prefers-reduced-motion`.
- HUD evoluída com combo máximo, preview de próxima bolha e status contextual.
- Microinterações visuais e animações de entrada no overlay.
- Suporte a controles por mouse, toque e teclado.

### Gameplay

- Assistente tático para melhor jogada possível por cor atual.
- Sistema de combo com multiplicador de pontuação.
- Modo Zen (sem novas linhas automáticas por disparo).
- Progressão por nível e persistência de recorde local.

### Backend, Segurança e API

- API versionada: `GET/POST /api/v1/leaderboard`, `GET /api/v1/health`.
- Validação estrita de payload e query com Zod.
- Hardening: Helmet, rate-limit, CORS controlável e limite de body JSON.
- Tratamento global de erros com resposta padronizada e `request-id`.
- Logging HTTP estruturado com correlação de requisição.

### Qualidade

- Testes de integração da API (health, validação, persistência/ranking).
- Testes unitários de contrato de validação.
- Estrutura preparada para expansão (novas rotas, auth, banco real, telemetria).

## Instalação e Execução

### Pré-requisitos

- Node.js `>= 18.18`

### Instalar dependências

```bash
npm install
```

### Rodar em desenvolvimento

```bash
npm run dev
```

Servidor disponível em: `http://localhost:3000`

### Rodar em produção local

```bash
npm start
```

### Rodar testes

```bash
npm test
```

## Variáveis de Ambiente

| Variável | Default | Descrição |
|---|---:|---|
| `PORT` | `3000` | Porta HTTP |
| `NODE_ENV` | `development` | Ambiente de execução |
| `CORS_ORIGIN` | `*` | Origem permitida para CORS |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Janela do rate limit |
| `RATE_LIMIT_MAX` | `160` | Máximo de requests por janela |
| `LEADERBOARD_FILE` | `server/data/leaderboard.json` | Caminho da persistência |

## Contrato da API

### `GET /api/v1/health`

Retorna status da aplicação.

### `GET /api/v1/leaderboard?limit=10`

Retorna top pontuações ordenadas por score.

### `POST /api/v1/leaderboard`

Payload:

```json
{
  "playerName": "Matheus",
  "score": 900,
  "level": 3,
  "combo": 4,
  "mode": "standard"
}
```

## Deploy

### Estratégia recomendada

1. Hospedar API Node (ex.: Render, Railway, Fly.io, VPS).
2. Manter `client/` servido pelo próprio Express ou via CDN/Nginx.
3. Configurar `NODE_ENV=production`, `CORS_ORIGIN` e limites de rate.
4. Substituir persistência JSON por banco (PostgreSQL/Redis) em produção escalável.

## Boas Práticas Adotadas

- Versionamento de API e contratos explícitos.
- Sanitização e validação rigorosa de entrada.
- Isolamento de domínio vs infraestrutura.
- Fallback resiliente no cliente para disponibilidade percebida.
- Logs e rastreabilidade por requisição.

## Roadmap Técnico

- Autenticação/autorização (JWT + perfis).
- Persistência em PostgreSQL com migrations.
- Observabilidade com métricas e tracing.
- Pipeline CI com lint, testes e análise estática.
- E2E automatizado do fluxo de jogo e leaderboard.
- Modo torneio e missões diárias.

## Licença

MIT (arquivo `LICENSE`).

Autoria: Matheus Siqueira  
Website: https://www.matheussiqueira.dev/
