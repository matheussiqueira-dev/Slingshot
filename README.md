# Slingshot

[![GitHub stars](https://img.shields.io/github/stars/matheussiqueira-dev/Slingshot?style=flat-square)](https://github.com/matheussiqueira-dev/Slingshot/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/matheussiqueira-dev/Slingshot?style=flat-square)](https://github.com/matheussiqueira-dev/Slingshot/network/members)
[![GitHub issues](https://img.shields.io/github/issues/matheussiqueira-dev/Slingshot?style=flat-square)](https://github.com/matheussiqueira-dev/Slingshot/issues)
[![Last commit](https://img.shields.io/github/last-commit/matheussiqueira-dev/Slingshot?style=flat-square)](https://github.com/matheussiqueira-dev/Slingshot/commits/main)
[![License](https://img.shields.io/github/license/matheussiqueira-dev/Slingshot?style=flat-square)](#licença)

[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Canvas](https://img.shields.io/badge/Canvas-2D-111111?style=flat-square)](https://developer.mozilla.org/docs/Web/API/Canvas_API)

Experiência arcade de bubble shooter com controle por webcam e estratégia em tempo real.

## Demo

![Slingshot demo](assets/slingshot-demo.gif)

## Visão Geral

Slingshot combina rastreamento de mãos com um shooter baseado em física e um motor de dicas estratégicas local. O foco é oferecer jogabilidade rápida, feedback visual imediato e decisões táticas sem dependências externas de IA.

## Principais Recursos

- Controle por gesto (pinch) com webcam
- Fisica e colisão em canvas
- Dicas estratégicas locais (sem chamadas externas)
- Sistema de pontuação e combos
- Interface focada em clareza e performance

## Tecnologias

- React + TypeScript
- Vite
- Canvas 2D
- MediaPipe Hands
- Tailwind (via CDN)

## Como Rodar Localmente

### Pré‑requisitos

- Node.js instalado

### Instalação

```bash
npm install
```

### Desenvolvimento

```bash
npm run dev
```

Abra: `http://localhost:3000`

### Build de Produção

```bash
npm run build
```

### Preview do Build

```bash
npm run preview
```

## Permissões de Câmera

O navegador pedirá acesso à câmera. Sem essa permissão o controle por gesto não funciona.

## Estrutura do Projeto

```
assets/               # mídias do projeto (gif demo)
components/           # UI e game loop
services/             # lógica de estratégia local
```

## Roadmap

- [ ] Publicar o código completo do jogo
- [ ] Refinar a física de colisão
- [ ] Melhorias de acessibilidade e onboarding
- [ ] Publicar demo jogável

## Licença

Definir.
