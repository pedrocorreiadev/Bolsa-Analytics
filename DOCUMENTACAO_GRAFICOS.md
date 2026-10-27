# BOLSA ANALYTICS
## Documentação Técnica — Gráficos, Indicadores e Interatividade

**Projeto:** Bolsa Analytics  
**Curso:** Sistemas de Informação  
**Responsável:** Willianny da Silva Mota  
**Área de atuação:** Desenvolvimento de gráficos, indicadores financeiros e componentes interativos.

### 1. Introdução

O Bolsa Analytics é uma aplicação web acadêmica voltada à visualização e análise de informações do mercado financeiro.

O projeto busca apresentar dados de ações de forma clara e interativa, permitindo que os usuários acompanhem variações de preços, consultem indicadores e comparem o desempenho de diferentes empresas.

Esta documentação descreve as funcionalidades desenvolvidas na área de gráficos e indicadores financeiros.

### 2. Objetivo do desenvolvimento

Implementar componentes interativos para facilitar a interpretação de dados financeiros, utilizando tecnologias de desenvolvimento web e recursos de visualização gráfica.

**Objetivos específicos:**

- Desenvolver gráficos de evolução dos preços das ações.
- Apresentar indicadores financeiros calculados automaticamente.
- Permitir a seleção de diferentes ações.
- Implementar filtros de períodos de análise.
- Identificar visualmente valorização e desvalorização.
- Comparar o desempenho de duas ações.
- Preparar os componentes para integração com uma API Python.

### 3. Tecnologias utilizadas

| Tecnologia | Aplicação |
|---|---|
| React | Desenvolvimento dos componentes da interface |
| TypeScript | Tipagem e organização do código |
| Recharts | Construção dos gráficos interativos |
| Vite | Ambiente de desenvolvimento e compilação |
| Git | Controle de versões |
| GitHub | Colaboração e armazenamento do código |

### 4. Funcionalidades desenvolvidas

**4.1. Gráfico de evolução das ações**

Foi desenvolvido um gráfico de linhas para representar a evolução dos preços das ações ao longo do tempo. O componente permite visualizar os valores por meio de interações com os pontos do gráfico.

**4.2. Indicadores financeiros**

Foram implementados quatro indicadores: preço atual, variação percentual no período, maior preço e menor preço.

Os valores são calculados automaticamente a partir dos dados apresentados.

**4.3. Seleção de ações**

Foi implementado um seletor que permite alternar entre PETR4 (Petrobras), VALE3 (Vale) e ITUB4 (Itaú), atualizando os gráficos e indicadores.

**4.4. Filtros de período**

Foram criados filtros de 7, 30 e 90 dias. A seleção modifica a quantidade de dados apresentados e atualiza os indicadores.

**4.5. Indicadores de tendência**

A variação percentual é apresentada com cores e símbolos, utilizando verde para valorização e vermelho para desvalorização.

**4.6. Serviço de dados financeiros**

Foi criado um serviço responsável por fornecer dados aos componentes, mantendo separada a lógica de obtenção das informações.

Também foram implementados estados de carregamento e tratamento de erros.

**4.7. Comparação entre ações**

Foi desenvolvido um gráfico que permite comparar duas ações selecionadas pelo usuário.

Para tornar a comparação mais adequada, os preços são normalizados em uma escala de base 100, permitindo avaliar o desempenho relativo de ativos com preços diferentes.

### 5. Organização dos arquivos

| Arquivo | Responsabilidade |
|---|---|
| `StockChart.tsx` | Gráfico de evolução das ações |
| `StockIndicators.tsx` | Indicadores financeiros |
| `StockComparison.tsx` | Comparação entre ações |
| `stocks.ts` | Tipos e dados simulados |
| `stockService.ts` | Serviço de obtenção dos dados |
| `App.tsx` | Integração dos componentes e controle dos estados |

### 6. Funcionamento dos dados

Durante o desenvolvimento, foram utilizados dados simulados para permitir testes independentes da API.

O sistema gera históricos de preços para os períodos disponíveis e utiliza esses valores para alimentar os gráficos e calcular os indicadores.

Os dados simulados não representam cotações reais e são utilizados exclusivamente para fins acadêmicos.

### 7. Testes realizados

Foram realizados testes manuais das funcionalidades:

- Seleção entre as ações disponíveis.
- Alternância entre períodos de 7, 30 e 90 dias.
- Atualização dos indicadores.
- Exibição dos gráficos.
- Comparação entre diferentes ações.
- Compilação do frontend utilizando `npm.cmd run build`.

A compilação foi concluída com sucesso, embora tenha sido apresentado um aviso não impeditivo relacionado ao tamanho do pacote JavaScript.

### 8. Integração com o backend

A aplicação foi preparada para receber dados de uma API desenvolvida em Python.

A integração definitiva depende da disponibilização dos endpoints, do formato de resposta e das informações de autenticação, quando aplicáveis.

Até essa etapa, o frontend continuará utilizando dados simulados.

### 9. Melhorias futuras

Entre as melhorias previstas estão a integração com cotações reais, o aperfeiçoamento da visualização dos gráficos, a otimização do tamanho do pacote JavaScript e a ampliação das possibilidades de análise financeira.

### 10. Considerações finais

O desenvolvimento dos gráficos e indicadores do Bolsa Analytics permitiu aplicar conhecimentos de programação frontend, componentização, tipagem, visualização de dados e controle de versões.

As funcionalidades implementadas contribuem para a construção de uma plataforma financeira interativa e estabelecem uma base para a integração com o backend e a evolução do projeto acadêmico.