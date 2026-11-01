# Arquitetura do Bolsa Analytics

O Bolsa Analytics reúne uma API Python/FastAPI e um frontend React/TypeScript em um único repositório. O frontend oferece visão geral, mercado, gráficos, candles e comparação de ativos. A API consulta históricos do Yahoo Finance por yfinance e valida os registros OHLCV com Pandas antes de entregar JSON.

## Execução com Docker

O `compose.yaml` inicia dois serviços:

| Serviço | Responsabilidade |
| --- | --- |
| `backend` | Python 3.12, FastAPI e Uvicorn, escutando em `0.0.0.0:8000` dentro da rede do Compose. Não publica uma porta na máquina. |
| `frontend` | Nginx servindo o build React e encaminhando `/api`, `/health` e a documentação ao backend. Publica `127.0.0.1:8081` por padrão. |

A entrega não depende de `.env`, Python, Node.js, ambientes virtuais ou dependências instaladas na máquina do professor. O comando `docker compose up --build -d`, executado na raiz após clonar o repositório, prepara e inicia o ambiente. Docker precisa estar em execução com contêineres Linux e acesso à internet. As instruções estão no [README](../README.md#executar-com-docker--entrega-ao-professor).

As imagens base são fixadas por digest. O build do frontend usa `npm ci` com o lockfile e executa lint, testes e compilação. O backend usa as dependências diretas de `requirements.txt`, com as versões transitivas fixadas por `requirements.lock.txt`, verifica a consistência com `pip check` e executa os testes existentes. A imagem final da API roda com um usuário sem privilégios e mantém um diretório de usuário gravável para os caches internos do yfinance.

O Compose aguarda o healthcheck do backend antes de iniciar o frontend. O healthcheck do frontend consulta `/health` através do Nginx, verificando também a comunicação entre os serviços. Os contêineres têm política de reinício `unless-stopped`. O proxy usa o DNS do Docker para acompanhar mudanças no endereço interno do backend.

No build Docker, `VITE_API_BASE_URL=/` resulta em chamadas como `/api/assets` na mesma origem do site. O proxy preserva esse caminho e os parâmetros da consulta. O nome interno `backend` não é utilizado pelo navegador. O fallback do Nginx para `index.html` permite abrir e atualizar as rotas React diretamente; erros HTTP da API continuam sendo respostas JSON.

Somente os arquivos necessários entram nas imagens. `.dockerignore` exclui ambientes virtuais, `node_modules`, builds locais, caches, logs e arquivos `.env`. Não existem volumes ou banco de dados a preparar. A variável opcional `BOLSA_PORT` altera a porta publicada sem recompilar a URL da API no frontend.

## Separação de responsabilidades

| Diretório ou arquivo | Responsabilidade |
| --- | --- |
| `backend/app/main.py` | Inicialização do FastAPI e configuração de CORS. |
| `backend/app/routes/` | Saúde, catálogo de ativos, parâmetros e erros HTTP. |
| `backend/app/services/` | Coordenação das consultas e montagem das respostas. |
| `backend/app/providers/` | Símbolos, metadados e acesso ao Yahoo Finance. |
| `backend/app/processing/` | Validação e tratamento dos registros OHLCV. |
| `backend/app/cache/` | Diretório reservado, sem cache de aplicação implementado no backend. |
| `backend/tests/` | Testes de processamento, contratos e rotas, com a fonte simulada por mocks. |
| `frontend/src/router/` | Navegação pela History API e parâmetros na URL. |
| `frontend/src/pages/` | Composição das cinco páginas e do laboratório acadêmico. |
| `frontend/src/components/` | Interface, barra lateral, gráficos e componentes reutilizáveis. |
| `frontend/src/services/` | Consultas HTTP, validação de respostas e compartilhamento das requisições. |
| `frontend/src/hooks/` e `frontend/src/context/` | Estado de consulta, atualização e integração com os componentes. |
| `frontend/src/utils/` e `frontend/src/types/` | Cálculos, formatação e contratos TypeScript. |
| `frontend/src/styles/` e `frontend/src/assets/` | Estilos e recursos visuais, incluindo SVGs locais do Phosphor. |

## Fluxo dos dados

```text
Yahoo Finance
    → provider yfinance
    → service e processamento com Pandas
    → rota FastAPI com resposta JSON
    → Nginx no Docker, preservando /api e a consulta
    → serviço HTTP e hooks React
    → páginas e componentes de gráfico
```

O catálogo inclui Petrobras, Vale, Ibovespa, dólar USD/BRL, euro EUR/BRL, libra GBP/BRL, iene JPY/BRL, ouro futuro GC=F e Bitcoin. Moeda, unidade e fuso acompanham os históricos. WDO não é atendido. Os detalhes de parâmetros, qualidade de dados e erros estão em [API.md](API.md).

Os históricos são ordenados e deduplicados, sem preencher sessões ausentes ou inventar candles. A comparação usa apenas datas comuns e sobrepõe preços somente quando moeda e unidade coincidem. Datas iguais entre mercados não garantem fechamentos simultâneos.

O serviço HTTP do frontend compartilha requisições em andamento e respostas por até 60 segundos. O panorama carregado permanece no contexto durante a navegação e pode ser atualizado manualmente. Não há autenticação, banco de dados, persistência funcional ou execução de operações financeiras.

O laboratório em `/graficos` mantém as séries locais simuladas separadas das consultas reais. Falhas da fonte são exibidas na interface e não são substituídas por dados artificiais. Os indicadores da barra lateral usam os mesmos históricos diários de um mês do panorama.

## Desenvolvimento local sem Docker

O desenvolvimento continua disponível com Vite em `http://localhost:5173` e FastAPI em `http://127.0.0.1:8000`. Nesse modo, crie o `.env` da raiz a partir de `.env.example`:

- `FRONTEND_ORIGIN` configura a origem única autorizada pelo CORS do backend.
- `VITE_API_BASE_URL` define a base das consultas HTTP do frontend.

O Vite lê o `.env` da raiz por `envDir: '..'`. Variáveis `VITE_*` são públicas e incorporadas ao build. O Uvicorn carrega o arquivo com `--env-file ../.env`. Os comandos completos estão no README; essa configuração local não é necessária para a entrega Docker.

As responsabilidades da equipe estão em [RESPONSABILIDADES.md](RESPONSABILIDADES.md) e o fluxo de colaboração em [GIT_WORKFLOW.md](GIT_WORKFLOW.md).
