# Plano de Evolução — slingshot

> Documento vivo, revisado semanalmente. Última revisão: 2026-11-05.
> Regra central: nenhuma mudança entra sem estar ligada a um objetivo desta página e sem manter ou melhorar as métricas da seção 2.

## 1. Identidade do projeto

- **Propósito:** bubble shooter no navegador com mira por arraste (Pointer Events: mouse, caneta e toque) ou teclado, ricochete lateral, dica tática de jogada e leaderboard com API e fallback local; case de física em Canvas e arquitetura modular sem build.
- **Tipo:** jogo web (ES Modules + Canvas 2D) servido por API Express com leaderboard em arquivo JSON.
- **Stack:** JavaScript ES Modules sem bundler, Canvas 2D; Node.js `>=22`, Express `^4.21.2` (instalado 4.22.3), `express-rate-limit` `^7.5.0` (7.5.1), `helmet` `^8.1.0`, `cors`, `morgan`, `zod` `^4.6.6` (4.6.6); testes `node:test` + `supertest` `^7.0.0`.
- **Gerenciador de pacotes:** npm (`package-lock.json`).
- **Deploy:** nenhum configurado (sem `vercel.json` nem Dockerfile; `.github/workflows/ci.yml` só valida); execução local via `npm start` em `http://localhost:3000`.
- **Estrutura:** `client/` (`index.html`, `styles.css`, `src/` com `game/` engine, grade hexagonal e dica, `rendering/`, `input/`, `ui/` (inclui `leaderboard-view.js`), `services/` API e leaderboard, `config/` (inclui `api-base.js`), `core/` event bus e storage); `server/src/` (app, config, middlewares, módulo `leaderboard` em routes → controller → service → repository); `server/data/leaderboard.json` versionado; `tests/` (API, serviço, cabeçalhos de segurança, cliente do ranking, `api-client` e renderização do ranking com DOM simulado); raiz com `index.html` de redirecionamento para `./client/`, `main.js` e `styles.css` de uma linha e `assets/` com cópia do GIF.
- **Comandos:** install `npm ci` · dev `npm run dev` · lint inexistente · typecheck inexistente · test `npm test` · build inexistente (cliente servido sem build)

## 2. Estado atual (baseline)

| Verificação | Comando | Resultado | Data |
| --- | --- | --- | --- |
| Instalação | `npm ci` | PASS | 2026-11-05 |
| Lint | — | não verificado (não há linter; B11) | 2026-11-05 |
| Typecheck | — | não verificado (JavaScript sem verificação de tipos) | 2026-11-05 |
| Testes | `npm test` | 47 passando / 0 falhando (8 arquivos; antes: 24) | 2026-11-05 |
| Cobertura | `node --test --experimental-test-coverage` | todos os arquivos: 98,60% linhas, 94,74% ramos, 95,24% funções (antes 95,80% / 86,88% / 92,62%); sem os arquivos de teste: 97,65% linhas; `grid-service` 99,14%, `hint-service`, `error-handler`, `not-found` e `leaderboard.controller` 100% | 2026-11-05 |
| Build | não há etapa de build (cliente servido sem build) | não aplicável; `npm start` não alterado nesta revisão, rotas cobertas por `supertest` | 2026-11-05 |
| Vulnerabilidades (audit) | `npm audit` | 0 critical / 0 high / 0 moderate / 0 low | 2026-11-05 |
| CI no GitHub | `.github/workflows/ci.yml` | run em `b1ea67f`: success nos jobs Node 22 e 24 (run do push anterior falhou pelo teste de `e2e6a12`) | 2026-11-05 |

Observações: Node local 22.23.4 (2026-11-05). Repositório privado. Jogabilidade completa em navegador real (arrastar e disparar), e2e, axe e Lighthouse não verificados (não há suíte e2e). `server/data/leaderboard.json` ainda contém duas entradas de exemplo ("Matheus" 1420, "Luna" 1180) que aparecem como ranking real quando o servidor roda (B4, depende do dono). Fontes do Google não carregam neste ambiente (rede bloqueada); a CSP já libera `fonts.googleapis.com` e `fonts.gstatic.com`. O GitHub Actions voltou a alocar runners em 2026-11-05, o que liberou o B6. Processo: `e2e6a12` subiu com 1 teste novo falhando (expectativa errada sobre empate de jogadas, sem efeito no produto), porque o push não ficou condicionado ao resultado da suíte; corrigido em `b1ea67f` minutos depois.

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
| O1 | Funcionamento | Ranking correto com e sem servidor e repositório sem resíduos | chamadas à API sem backend configurado; arquivos-stub na raiz | 1 por carga; 3 stubs + GIF duplicado (2026-10-29: 0 chamadas sem backend; stubs e GIF mantidos) | 0; 0 | P1 | ativo (falta B8, depende do dono) |
| O2 | Cobertura de testes | Testar grade, dica e servidor | testes do cliente; % linhas do servidor | 0; 94,5% (2026-11-05: 16 testes de grade/dica; total 98,6%; sem testes 97,65%) | ≥ 10 testes de `grid-service`/`hint-service`; servidor ≥ 97% | P2 | monitorado (meta atingida em 2026-11-05) |
| O3 | Segurança | Zerar high e endurecer defaults | high em `npm audit --omit=dev`; política de origens; CSP | 2; pendente; pendente (2026-10-29: 0; só origens configuradas; CSP ativa e testada) | 0; apenas origens explicitamente configuradas; CSP ativa | P0 | monitorado (meta atingida em 2026-10-29) |
| O4 | Performance | Reduzir mídia versionada | tamanho total de GIFs | 27,5 MB (2 × 13,8 MB) | ≤ 3 MB | P2 | ativo |
| O5 | Qualidade/Manutenibilidade | Lint e CI | workflows; erros de lint | 0; sem linter (2026-11-05: 1 workflow; sem linter) | CI com test + lint + audit; 0 erros | P1 | ativo (falta B11) |
| O6 | Dados/UX | Ranking sem dado fabricado e acessível | entradas de exemplo apresentadas como reais; violações axe serious/critical | 2; não verificado (2026-10-29: 2; ranking renderizado só como texto; axe não verificado) | 0; 0 | P1 | ativo (B4 depende do dono) |

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

- [x] **B1 (P0, O3)** _(2026-10-28, `4f316fa`, PR #7 consolidado pelo dono)_ Atualizar `body-parser` (`npm audit fix`, sem major) — advisory GHSA-27r3-jxmh-p828 ausente do audit; `npm test` verde.
- [x] **B2 (P1, O3)** _(2026-10-28, `4f316fa`: `zod` 4.6.6 aprovado e aplicado pelo dono; testes verdes em 2026-10-29)_ Migrar `zod` 3 → 4 (major, exige aprovação) ou registrar exceção documentada até a migração — `npm audit --omit=dev --audit-level=high` com exit 0, ou exceção com data de revisão nesta página.
- [x] **B3 (P1, O1)** _(2026-10-29, `68f1b81`: o cliente só chama a API quando a página traz `<meta name="slingshot-api-base">` com caminho da mesma origem; o Express injeta `/api/v1` ao servir o HTML; sem backend, título "Seus melhores resultados" e nota "Salvo neste navegador"; testes em `tests/leaderboard-client.test.js`, `tests/api-client.test.js` (`5111442`) e `tests/api.leaderboard.test.js`)_ Não chamar a API quando não houver backend configurado (`API_CONFIG.baseUrl` nulo fora de `localhost`); com ranking local, título "Seus melhores resultados" e nota "Salvo neste navegador" — teste `node:test` do `leaderboard-service` com `fetch` simulado: zero chamadas e lista local ordenada.
- [ ] **B4 (P1, O6)** Trocar as entradas de exemplo de `server/data/leaderboard.json` por lista vazia e manter o arquivo de runtime fora do Git — `git ls-files server/data` só com exemplo vazio; testes usam diretório temporário.
- [x] **B5 (P1, O3)** _(2026-10-29, `d7a3539`: `CORS_ORIGIN` vazio por padrão aceita só a mesma origem, lista separada por vírgula, `*` só explícito; CSP via Helmet sem `unsafe-inline`/`unsafe-eval`; testes em `tests/security-headers.test.js`)_ Política de origens restritiva por padrão e Content Security Policy ativa e restritiva — testes automatizados: origem não configurada é recusada; todas as respostas HTML trazem `Content-Security-Policy`.
- [x] **B6 (P1, O5)** _(2026-11-05, `d13ee73`: matriz 22 e 24, `npm audit` estrito, `engines.node` `>=22`)_ CI `.github/workflows/ci.yml` com `npm ci`, `npm test` e audit em Node 22 e 24; `engines.node` para `>=22` — workflow verde em PR.
- [x] **B7 (P1, O6)** _(2026-10-29, `9d4d198`: `client/src/ui/leaderboard-view.js` monta a lista com `textContent`; testes com DOM simulado em `tests/leaderboard-view.test.js`)_ Todo conteúdo fornecido pelo usuário renderizado como texto, nunca como HTML — teste automatizado confirma que marcação em nomes aparece literalmente na lista.
- [ ] **B8 (P2, O1)** Remover stubs da raiz (`index.html`, `main.js`, `styles.css`) e a cópia do GIF, deixando uma mídia ≤ 3 MB para o README (após aprovação) — `git ls-files` sem os stubs; README renderiza a mídia.
- [x] **B9 (P2, O2)** _(2026-11-05, `e2e6a12` + `b1ea67f`: 16 testes em `tests/grid-service.test.js`)_ Testes de `grid-service` (vizinhos em linha par e ímpar, grupo de 3 estoura e de 2 não, bolhas soltas caem) e `hint-service` (maior grupo vence) — ≥ 10 testes no `npm test`.
- [x] **B10 (P2, O2)** _(2026-11-05, `1301de9`: 7 testes em `tests/server-errors.test.js`, inclusive armazenamento corrompido respondendo 500 genérico)_ Cobrir `not-found.js`, `error-handler.js` e ramos do repositório — servidor ≥ 97% de linhas.
- [ ] **B11 (P2, O5)** ESLint flat config para ES Modules de navegador e Node — `npm run lint` com 0 erros no CI.
- [ ] **B12 (P2, O6)** E2E Playwright: arrastar e soltar dispara, Espaço dispara, diálogo de fim acessível por teclado; axe em 320/768/1280 px — 0 violações serious/critical; sem overflow em 320 px.
- [ ] **B13 (P2, O6)** Bolhas com símbolo por cor além da cor (6 pares sem repetição) para legibilidade com daltonismo — teste da tabela cor→símbolo.
- [ ] **B14 (P3, O2)** Desafio diário com semente (mesma semente → mesma grade e sequência de cores) — teste de reprodutibilidade da geração.
- [ ] **B15 (P2, O3)** Atualizar dentro da major `helmet` 8.1.0 → 8.3.0, `zod` 4.6.6 → 4.6.7 e `supertest` 7.2.2 → 7.3.1, após ler as notas de versão — `npm test` verde, CSP inalterada e `npm audit` sem high.
- [ ] **B16 (P2, O3)** Se o jogo for publicado com API em outro domínio, permitir no cliente uma base de API absoluta junto com `connect-src` correspondente na CSP — teste de `resolveApiBaseUrl` e do cabeçalho; depende da decisão de deploy.

## 7. Radar técnico

| Data | Item | Fonte | Veredito (adotar / avaliar / descartar) | Motivo |
| --- | --- | --- | --- | --- |
| 2026-10-23 | Advisory `zod` <4.6.6 sem correção na linha 3 | https://github.com/advisories/GHSA-mrhx-c7xc-m3w5 | adotar | Exige migração para Zod 4 (B2) |
| 2026-10-23 | Zod 4: guia de migração | https://zod.dev/v4/changelog | avaliar | Mudanças de API em mensagens de erro e `.strict()`; escopo pequeno (um serviço) |
| 2026-10-23 | Express 5 como linha atual; 4.x segue suportada | https://expressjs.com/en/support/ | avaliar | Migração só junto com outra mudança do servidor; não é urgente |
| 2026-10-23 | Node.js 18 e 20 em EOL; 22 e 24 em LTS | https://nodejs.org/en/about/previous-releases | adotar | `engines` declara `>=18.18` (B6) |
| 2026-10-23 | Playwright 1.64 | https://playwright.dev/docs/release-notes | adotar | Base do e2e de arraste e teclado (B12) |
| 2026-10-29 | Node.js October 2026 security releases (22.x, 24.x e 26.x) | https://nodejs.org/en/blog/vulnerability/october-2026-security-releases | adotar | Ambiente local já em 22.23.4; reforça `engines` `>=22` e CI em 22/24 (B6) |
| 2026-10-29 | Express 4.x em manutenção; 5.x é a linha atual (5.3.0 publicada) | https://expressjs.com/en/support | avaliar | Migração 4 → 5 é major e muda roteamento curinga (`app.get("*")`); fica para decisão do dono |
| 2026-10-29 | Helmet 8.3.0 | https://cdn.jsdelivr.net/npm/helmet@8.3.0/CHANGELOG.md | avaliar | Mesma major; atualização de rotina ligada a O3 (B15) |
| 2026-10-29 | CSP explícita com `useDefaults: false` no Helmet | https://helmetjs.github.io/ | adotar | Evita `upgrade-insecure-requests` no uso local por HTTP e deixa a política auditável em teste (B5) |
| 2026-11-05 | `actions/checkout` e `actions/setup-node` v6 (runtime `node24`) | https://github.com/actions/setup-node/releases | adotar | Workflow novo sem o aviso de Node 20 (B6) |
| 2026-11-05 | Helmet 8.3.0, Zod 4.6.7 e Supertest 7.3.1 seguem disponíveis | https://www.npmjs.com/package/helmet | avaliar | `npm audit` em 0 e O3 monitorado; B15 parado enquanto o objetivo estiver monitorado |

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
- Aprovar a arte com estilingue desenhado e símbolos por cor?
- Mudança de comportamento em 2026-10-29: sem `CORS_ORIGIN`, a API deixou de liberar `*`; um frontend em outro domínio precisa ter a origem listada em `CORS_ORIGIN` (e, no cliente, ver B16).
- Migrar Express 4 → 5 (major)?

## 10. Registro semanal

| Data | Auditoria | Mudanças (commits) | Métricas | Próximo foco |
| --- | --- | --- | --- | --- |
| 2026-10-23 | Documento inicial e baseline | — | ver seção 2 | B1, B2, B3, B6 |
| 2026-10-29 | Auditoria completa: install, testes com cobertura, audit, `node --check`, smoke HTTP e Chromium headless (servidor e estático); B1/B2 já resolvidos pelo dono em `4f316fa`; sem CI próprio | `9d4d198` B7, `68f1b81` B3, `d7a3539` B5, `5111442` testes do `api-client`; nenhuma feature (nenhuma aprovada e as de arte aguardam o dono; F1 adiada para manter o ciclo pequeno) | testes 5 → 24; cobertura 94,50% → 95,80% linhas, 73,91% → 86,88% ramos; high 0 → 0 | B6 (quando o Actions voltar), B9, B10, B15 |
| 2026-11-05 | Auditoria completa: install, testes com cobertura, audit; Actions de volta | `d13ee73` B6, `e2e6a12` + `b1ea67f` B9, `1301de9` B10; nenhuma feature (nenhuma aprovada; as de arte aguardam o dono) | testes 24 → 47; cobertura 95,80% → 98,60% linhas, 86,88% → 94,74% ramos; audit 0 → 0; workflows 0 → 1 | B11, B12, decisões B4/B8 |
