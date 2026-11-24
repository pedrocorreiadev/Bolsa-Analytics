# Recursos de terceiros

## Identidade visual dos ativos

Os arquivos em `frontend/public/asset-icons/` identificam os ativos do catálogo.
As marcas mantêm suas cores originais e pertencem aos respectivos titulares.

- Petrobras: ícone do [site oficial](https://petrobras.com.br/quem-somos/nossa-marca),
  arquivo `https://petrobras.com.br/o/tema-site-externo-petrobras/images/favicon.ico`.
- Vale: símbolo do [site oficial](https://vale.com/pt), arquivo
  `https://vale.com/documents/44618/57981/fav_128px/550e3a42-f32c-7356-de52-41320d095395`.
- Ibovespa: identificado pela marca da [B3](https://www.b3.com.br/pt_br/), bolsa
  responsável pelo índice; não é apresentado como um logotipo exclusivo do Ibovespa.
  Arquivo `https://www.b3.com.br/documents/20126/35724/favicon/9de43049-c725-809d-a264-5a0a56599e6b`.
- Bitcoin: símbolo publicado no [Bitcoin.org](https://bitcoin.org/), arquivo
  `https://bitcoin.org/img/icons/logo_ios.png`.
- Câmbio: bandeiras de EUA, União Europeia, Reino Unido e Japão, com a bandeira
  brasileira indicando a moeda de cotação. Arquivos do projeto
  [flag-icons](https://github.com/lipis/flag-icons), licença MIT, Copyright (c)
  2013 Panayiotis Lipiridis. A licença completa está em
  `frontend/public/licenses/flag-icons-LICENSE`.
- Ouro futuro: pictograma local de barras de ouro em `AssetIcon.tsx`.

As imagens são distribuídas junto ao frontend, sem consultas a serviços de
logos ou bandeiras durante o uso da aplicação. O uso é de identificação do
ativo; não indica parceria ou endosso das organizações representadas.

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
