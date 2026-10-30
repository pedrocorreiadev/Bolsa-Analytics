# Recursos de terceiros

## Phosphor Icons

Os ícones locais em `frontend/src/assets/icons/` e os desenhos correspondentes
em `frontend/src/components/Icon.tsx` são do projeto [Phosphor Icons](https://phosphoricons.com/),
distribuídos sob licença MIT.

- Fonte: [phosphor-icons/core](https://github.com/phosphor-icons/core/tree/main/assets).
- Copyright (c) 2023 Phosphor Icons.
- Pesos utilizados: `duotone` para navegação e `fill` para ações e sinais.
- A licença original completa está preservada em
  [`frontend/src/assets/icons/LICENSE`](frontend/src/assets/icons/LICENSE).

Os arquivos SVG são armazenados no projeto; os ícones não dependem de CDN,
fontes remotas ou pacotes adicionais em tempo de execução. A adaptação React
preserva os desenhos originais e utiliza `currentColor` para acompanhar o tema.

## OpenTerminal

A organização visual foi adaptada após consulta às capturas, Sidebar, TopBar e
estilos do [OpenTerminal](https://github.com/ErTasselli/OpenTerminal): terminal
escuro, cabeçalhos compactos em âmbar, navegação lateral, divisões finas e tabelas
densas. O backend da referência não foi importado; a implementação mantém a stack
e os contratos do Bolsa Analytics.

MIT License, Copyright (c) 2026 OpenTerminal contributors. Licença completa:
[`frontend/public/licenses/OpenTerminal-LICENSE`](frontend/public/licenses/OpenTerminal-LICENSE).

## Lightweight Charts

Os candles utilizam [TradingView Lightweight Charts](https://github.com/tradingview/lightweight-charts)
5.2.1, Apache-2.0. O gráfico mantém o logotipo/link de atribuição do TradingView.

TradingView Lightweight Charts™
Copyright (с) 2025 TradingView, Inc. https://www.tradingview.com/

Licença e aviso de atribuição preservados em `frontend/public/licenses/`, que
também é incluída no build. Os desenhos Phosphor têm sua licença MIT copiada para
a mesma pasta.
