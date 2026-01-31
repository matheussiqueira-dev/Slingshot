# Slingshot Flash 3

Bubble Shooter controlado por gestos com suporte a webcam e copiloto estrategico em tempo real. O jogo roda no navegador e usa MediaPipe Hands para detectar pinca (polegar + indicador) e a fisgada do estilingue.

## Visao geral
Slingshot Flash 3 e um prototipo jogavel com foco em acessibilidade, interface limpa e jogabilidade intuitiva. O fundo e a propria captura da webcam (com blur leve), enquanto as bolhas e a HUD ficam em primeiro plano.

## Principais recursos
- Controle por gestos com webcam (pinça, puxe e solte).
- Copiloto estrategico com sugestoes de jogadas e destaque visual.
- HUD simples, com botoes autoexplicativos e status em tempo real.
- Calibracao de gestos para melhorar precisao e conforto.
- Fallback total para mouse (clique, arraste e solte).

## Stack
- HTML5 Canvas + JavaScript (render e logica do jogo)
- MediaPipe Hands (rastreamento de mao via webcam)
- CSS moderno com layout responsivo

## Como executar
1. Inicie um servidor local:
   - `python -m http.server`
2. Abra no navegador:
   - `http://localhost:8000`
3. Permita acesso a camera quando solicitado.

> Dica: a webcam so funciona em contexto seguro (https) ou localhost.

## Usando a Logitech BRIO 305
O sistema tenta selecionar automaticamente a BRIO 305 pelo nome. Ao ativar a camera, o status mostra o dispositivo escolhido.

## Controles
- **Webcam**: pinça (polegar + indicador), puxe para tras e solte para lancar.
- **Mouse**: clique e arraste para tras, solte para lancar.
- **Copiloto**: botao "Copiloto: On/Off".
- **Calibrar gesto**: refina a sensibilidade para sua mao.

## Calibracao de gestos
1. Clique em **Calibrar gesto**.
2. Mantenha a mao aberta e faca movimentos leves por ~2s.
3. Depois use a pinça para lancar.

Se estiver dificil, calibre novamente mantendo a mao mais centralizada.

## Acessibilidade e conforto
- Movimentos pequenos ja funcionam (modo permissivo).
- Feedback visual para potencia, mira e status do gesto.
- Interface clara e com bom contraste.

## Solucao de problemas
- **Nao detecta a mao**: verifique iluminacao e aproxime a mao da camera.
- **Nao inicia a camera**: confirme permissao no navegador.
- **Gestos inconsistentes**: use o botao de calibracao.

## Roadmap (suggestao)
- Seletor manual de cameras.
- Presets de sensibilidade (normal / sensivel / ultra).
- Efeitos sonoros e particulas.

## Licenca
Defina a licenca desejada (ex.: MIT) antes de distribuir publicamente.
