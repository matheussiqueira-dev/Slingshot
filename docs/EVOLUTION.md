# Plano de Evolução — slingshot

> Documento vivo, revisado semanalmente. Última revisão: 2026-10-23.
> Regra central: nenhuma mudança entra sem estar ligada a um objetivo desta página e sem manter ou melhorar as métricas da seção 2.

## 1. Identidade do projeto

- **Propósito:** bubble shooter no navegador com mira por arraste (Pointer Events: mouse, caneta e toque) ou teclado, ricochete lateral, dica tática de jogada e leaderboard com API e fallback local; case de física em Canvas e arquitetura modular sem build.
- **Tipo:** jogo web (ES Modules + Canvas 2D) servido por API Express com leaderboard em arquivo JSON.
- **Stack:** JavaScript ES Modules sem bundler, Canvas 2D; Node.js `>=18.18`, Express `^4.21.2` (instalado 4.22.3), `express-rate-limit` `^7.5.0` (7.5.1), `helmet` `^8.1.0`, `cors`, `morgan`, `zod` `^3.24.1` (3.25.76); testes `node:test` + `supertest` `^7.0.0`.
- **Gerenciador de pacotes:** npm (`package-lock.json`).
- **Deploy:** nenhum configurado (sem `vercel.json`, Dockerfile ou workflow); execução local via `npm start` em `http://localhost:3000`.
- **Estrutura:** `client/` (`index.html`, `styles.css`, `src/` com `game/` engine, grade hexagonal e dica, `rendering/`, `input/`, `ui/`, `services/` API e leaderboard, `core/` event bus e storage); `server/src/` (app, config, middlewares, módulo `leaderboard` em routes → controller → service → repository); `server/data/leaderboard.json` versionado; `tests/` (API e serviço); raiz com `index.html` de redirecionamento para `./client/`, `main.js` e `styles.css` de uma linha e `assets/` com cópia do GIF.
- **Comandos:** install `npm ci` · dev `npm run dev` · lint inexistente · typecheck inexistente · test `npm test` · build inexistente (cliente servido sem build)

## 2. Estado atual (baseline)

| Verificação | Comando | Resultado | Data |
| --- | --- | --- | --- |
| Instalação | `npm ci` | PASS | 2026-10-23 |
| Lint | — | não verificado (não há linter); `node --check` em todos os `.js` de `client/src` e `server/src` sem erro | 2026-10-23 |
| Typecheck | — | não verificado (JavaScript sem verificação de tipos) | 2026-10-23 |
| Testes | `npm test` | 5 passando / 0 falhando (2 arquivos, só servidor) | 2026-10-23 |
| Cobertura | `node --test --experimental-test-coverage` | servidor: 94,5% linhas, 73,9% ramos; `error-handler.js` 68,0%, `not-found.js` 11,1%; cliente 0% (sem testes) | 2026-10-23 |
| Build | `npm start` + `curl` em `/api/v1/health`, `/` e `/client/` | PASS (200, 200, 200); não há etapa de build | 2026-10-23 |
| Vulnerabilidades (audit) | `npm audit --omit=dev --json` | 0 critical / 2 high / 0 moderate (`body-parser` <1.20.9, GHSA-27r3-jxmh-p828, correção sem major; `zod` <4.6.6, GHSA-mrhx-c7xc-m3w5, correção exige major 3→4) | 2026-10-23 |
| CI no GitHub | — | nenhum workflow (`.github/` inexistente) | 2026-10-23 |

Observações: Node local 22.22.0. Jogabilidade em navegador real, e2e, axe e Lighthouse não verificados (não há suíte e2e). `server/data/leaderboard.json` contém duas entradas de exemplo ("Matheus" 1420, "Luna" 1180) que aparecem como ranking real quando o servidor roda. Configuração de segurança do servidor a endurecer (ver O3). O cliente sempre chama `/api/v1` (`client/src/config/game-config.js:42-45`): numa publicação estática cada carga gera erro antes do fallback local.

## 3. Histórico e trajetória

13 commits entre 2026-01-31 e 2026-10-11.

- **2026-01-31 — primeira versão:** "Slingshot Flash 3" com webcam, README e badges.
- **2026-02-01 — recomeço:** remoção de todos os arquivos e nova versão otimizada, com suporte a toque e sem dependências externas (a webcam saiu do produto).
- **2026-02-08 — refatoração fullstack:** frontend modular, API segura com `zod`, rate limit e leaderboard com fallback local.
- **2026-10-11 — higiene:** `npm audit fix` (7 vulnerabilidades), correção do diretório do cliente relativo à raiz do projeto, pastas locais ignoradas.

O histórico é curto e concentrado em lotes grandes; o refactor de fevereiro introduziu a camada de servidor sem testes do cliente e sem CI, e deixou stubs na raiz e o GIF de 13.761.074 bytes duplicado em `assets/` e `client/assets/`.

## 4. Objetivos definidos (critério de parada)

| # | Eixo | Objetivo | Métrica | Baseline | Meta | Prioridade | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| O1 | Funcionamento | Ranking correto com e sem servidor e repositório sem resíduos | chamadas à API sem backend configurado; arquivos-stub na raiz | 1 por carga; 3 stubs + GIF duplicado | 0; 0 | P1 | ativo |
| O2 | Cobertura de testes | Testar grade, dica e servidor | testes do cliente; % linhas do servidor | 0; 94,5% | ≥ 10 testes de `grid-service`/`hint-service`; servidor ≥ 97% | P2 | ativo |
| O3 | Segurança | Zerar high e endurecer defaults | high em `npm audit --omit=dev`; política de origens; CSP | 2; pendente; pendente | 0; apenas origens explicitamente configuradas; CSP ativa | P0 | ativo |
| O4 | Performance | Reduzir mídia versionada | tamanho total de GIFs | 27,5 MB (2 × 13,8 MB) | ≤ 3 MB | P2 | ativo |
| O5 | Qualidade/Manutenibilidade | Lint e CI | workflows; erros de lint | 0; sem linter | CI com test + lint + audit; 0 erros | P1 | ativo |
| O6 | Dados/UX | Ranking sem dado fabricado e acessível | entradas de exemplo apresentadas como reais; violações axe serious/critical | 2; não verificado | 0; 0 | P1 | ativo |

## 5. Guardrails

- Mudança só com objetivo associado (O#) ou item de backlog (B#); refatoração sem ganho mensurável é proibida.
- Nenhuma métrica da seção 2 pode piorar; se piorar, a mudança é revertida.
- Upgrade de versão major, mudança de arquitetura, remoção de funcionalidade e alteração de deploy exigem aprovação do dono (entram em "Decisões pendentes").
- No máximo uma feature nova por semana, de risco baixo, atrás de testes.
- Não alterar as regras de jogo (`shotsPerRow`, nível a cada 520 pontos, `maxRows` 13) sem teste que documente o comportamento novo.
- O cliente continua rodando sem build; dependência de bundler só com aprovação.
- A chave `slingshot_local_leaderboard_v2` guarda resultados de visitantes: mudança de formato precisa ler o formato atual.

## 6. Backlog priorizado

- P0 = quebra funcionamento/segurança · P1 = risco alto · P2 = qualidade · P3 = melhoria

- [ ] **B1 (P0, O3)** Atualizar `body-parser` (`npm audit fix`, sem major) — advisory GHSA-27r3-jxmh-p828 ausente do audit; `npm test` verde.
- [ ] **B2 (P1, O3)** Migrar `zod` 3 → 4 (major, exige aprovação) ou registrar exceção documentada até a migração — `npm audit --omit=dev --audit-level=high` com exit 0, ou exceção com data de revisão nesta página.
- [ ] **B3 (P1, O1)** Não chamar a API quando não houver backend configurado (`API_CONFIG.baseUrl` nulo fora de `localhost`); com ranking local, título "Seus melhores resultados" e nota "Salvo neste navegador" — teste `node:test` do `leaderboard-service` com `fetch` simulado: zero chamadas e lista local ordenada.
- [ ] **B4 (P1, O6)** Trocar as entradas de exemplo de `server/data/leaderboard.json` por lista vazia e manter o arquivo de runtime fora do Git — `git ls-files server/data` só com exemplo vazio; testes usam diretório temporário.
- [ ] **B5 (P1, O3)** Política de origens restritiva por padrão e Content Security Policy ativa e restritiva — testes automatizados: origem não configurada é recusada; todas as respostas HTML trazem `Content-Security-Policy`.
- [ ] **B6 (P1, O5)** CI `.github/workflows/ci.yml` com `npm ci`, `npm test` e audit em Node 22 e 24; `engines.node` para `>=22` — workflow verde em PR.
- [ ] **B7 (P1, O6)** Todo conteúdo fornecido pelo usuário renderizado como texto, nunca como HTML — teste automatizado confirma que marcação em nomes aparece literalmente na lista.
- [ ] **B8 (P2, O1)** Remover stubs da raiz (`index.html`, `main.js`, `styles.css`) e a cópia do GIF, deixando uma mídia ≤ 3 MB para o README (após aprovação) — `git ls-files` sem os stubs; README renderiza a mídia.
- [ ] **B9 (P2, O2)** Testes de `grid-service` (vizinhos em linha par e ímpar, grupo de 3 estoura e de 2 não, bolhas soltas caem) e `hint-service` (maior grupo vence) — ≥ 10 testes no `npm test`.
- [ ] **B10 (P2, O2)** Cobrir `not-found.js`, `error-handler.js` e ramos do repositório — servidor ≥ 97% de linhas.
- [ ] **B11 (P2, O5)** ESLint flat config para ES Modules de navegador e Node — `npm run lint` com 0 erros no CI.
- [ ] **B12 (P2, O6)** E2E Playwright: arrastar e soltar dispara, Espaço dispara, diálogo de fim acessível por teclado; axe em 320/768/1280 px — 0 violações serious/critical; sem overflow em 320 px.
- [ ] **B13 (P2, O6)** Bolhas com símbolo por cor além da cor (6 pares sem repetição) para legibilidade com daltonismo — teste da tabela cor→símbolo.
- [ ] **B14 (P3, O2)** Desafio diário com semente (mesma semente → mesma grade e sequência de cores) — teste de reprodutibilidade da geração.

## 7. Radar técnico

| Data | Item | Fonte | Veredito (adotar / avaliar / descartar) | Motivo |
| --- | --- | --- | --- | --- |
| 2026-10-23 | Advisory `zod` <4.6.6 sem correção na linha 3 | https://github.com/advisories/GHSA-mrhx-c7xc-m3w5 | adotar | Exige migração para Zod 4 (B2) |
| 2026-10-23 | Zod 4: guia de migração | https://zod.dev/v4/changelog | avaliar | Mudanças de API em mensagens de erro e `.strict()`; escopo pequeno (um serviço) |
| 2026-10-23 | Express 5 como linha atual; 4.x segue suportada | https://expressjs.com/en/support/ | avaliar | Migração só junto com outra mudança do servidor; não é urgente |
| 2026-10-23 | Node.js 18 e 20 em EOL; 22 e 24 em LTS | https://nodejs.org/en/about/previous-releases | adotar | `engines` declara `>=18.18` (B6) |
| 2026-10-23 | Playwright 1.64 | https://playwright.dev/docs/release-notes | adotar | Base do e2e de arraste e teclado (B12) |

## 8. Ideias de features

| # | Feature | Valor para o usuário/portfólio | Risco | Status (proposta / aprovada / implementada / descartada) |
| --- | --- | --- | --- | --- |
| F1 | Desafio diário com semente | Partidas comparáveis entre jogadores; demonstra reprodutibilidade | baixo | proposta |
| F2 | Estilingue desenhado com elástico proporcional à força | Dá identidade ao nome e feedback de força | baixo | proposta |
| F3 | Bolhas com símbolo por cor | Acessibilidade para daltonismo | baixo | proposta |
| F4 | Replay da última jogada com a trajetória do ricochete | Ajuda a entender a mira e a física | médio | proposta |

## 9. Decisões pendentes do dono

- Criar publicação estática (Root Directory `client`, sem build e sem Functions) com ranking local?
- Remover os stubs da raiz e a cópia do GIF, deixando uma mídia comprimida?
- Trocar as entradas "Matheus" e "Luna" por lista vazia?
- Aprovar a migração Zod 3 → 4 (major) para fechar o advisory high?
- Aprovar a arte com estilingue desenhado e símbolos por cor?

## 10. Registro semanal

| Data | Auditoria | Mudanças (commits) | Métricas | Próximo foco |
| --- | --- | --- | --- | --- |
| 2026-10-23 | Documento inicial e baseline | — | ver seção 2 | B1, B2, B3, B6 |
