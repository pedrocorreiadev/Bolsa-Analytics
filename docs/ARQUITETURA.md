# Arquitetura do Bolsa Analytics

O Bolsa Analytics reúne API Python/FastAPI e frontend React/TypeScript. Oferece visão geral, mercado, gráficos, candles, comparação, tendências, cotações intradiárias, login e áreas pessoal e administrativa. A API consulta Yahoo Finance por yfinance, valida registros com Pandas e calcula tendências. SQLite persiste usuários, preferências e sessões.

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

Somente os arquivos necessários entram nas imagens. `.dockerignore` exclui ambientes virtuais, `node_modules`, builds locais, caches, logs, arquivos `.env` e bancos locais. O volume `bolsa-data` é criado automaticamente para o SQLite em `/app/data/bolsa.sqlite3`, com diretório gravável pelo usuário do backend. A variável opcional `BOLSA_PORT` altera a porta publicada sem recompilar a URL da API no frontend.

## Separação de responsabilidades

| Diretório ou arquivo | Responsabilidade |
| --- | --- |
| `backend/app/main.py` | Inicialização do FastAPI e configuração de CORS. |
| `backend/app/routes/` | Saúde, catálogo de ativos, parâmetros e erros HTTP. |
| `backend/app/services/` | Coordenação das consultas e montagem das respostas. |
| `backend/app/providers/` | Símbolos, metadados e acesso ao Yahoo Finance. |
| `backend/app/processing/` | Validação e tratamento dos registros OHLCV. |
| `backend/app/cache/` | Cache de até 60s por consulta, exclusão mútua, contadores e últimos 50 eventos. |
| `backend/app/database.py` | Conexões SQLite, tabelas de usuários, sessões e limitação de tentativas. |
| `backend/app/processing/tendencias.py` | Médias móveis, regressão, estatística descritiva, correlação e projeções. |
| `backend/tests/` | Testes de processamento, contratos e rotas, com a fonte simulada por mocks. |
| `frontend/src/router/` | Navegação pela History API e parâmetros na URL. |
| `frontend/src/pages/` | Páginas do terminal, contas, administração e laboratório. |
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

O serviço HTTP do frontend compartilha históricos em andamento e respostas por até 60 segundos. O panorama permanece no contexto durante a navegação, com atualização manual ou automática configurada no perfil. Cotações intradiárias têm controle próprio. O cache do backend evita coletas simultâneas repetidas; seus eventos e contadores são do processo, sem persistência. Falhas da fonte são propagadas, sem transformá-las silenciosamente em séries vazias.

`AccountProvider` verifica a sessão ao iniciar. A API usa cookies HttpOnly com token aleatório cujo hash é armazenado no SQLite. Login e logout renovam/revogam a sessão; alteração de senha revoga outras sessões. Senhas usam PBKDF2-HMAC-SHA256 com sal. Endpoints pessoais validam sessão e endpoints administrativos verificam o papel no servidor. Mutações exigem cabeçalho específico, e CORS restringe a origem. O banco local padrão fica em `backend/data/`, ignorado pelo Git. Não há execução de operações financeiras. Veja [Tendências e contas](TENDENCIAS_E_CONTAS.md).

O laboratório em `/graficos` mantém as séries locais simuladas separadas das consultas reais. Falhas da fonte são exibidas na interface e não são substituídas por dados artificiais. Os indicadores da barra lateral usam os mesmos históricos diários de um mês do panorama.

## Desenvolvimento local sem Docker

O desenvolvimento continua disponível com Vite em `http://localhost:5173` e FastAPI em `http://127.0.0.1:8000`. Nesse modo, crie o `.env` da raiz a partir de `.env.example`:

- `FRONTEND_ORIGIN` configura a origem única autorizada pelo CORS do backend.
- `API_PROXY_TARGET` define o destino do proxy Vite/preview; o navegador sempre usa a mesma origem (`/api`). A configuração antiga `VITE_API_BASE_URL=http://...` pode fornecer o destino na ausência dessa variável.
- `BOLSA_DB_PATH` opcional altera o arquivo SQLite; `BOLSA_COOKIE_SECURE=true` habilita cookie Secure em hospedagem HTTPS.

O Vite lê o `.env` da raiz por `envDir: '..'`. Variáveis `VITE_*` são públicas e incorporadas ao build. O Uvicorn carrega o arquivo com `--env-file ../.env`. Os comandos completos estão no README; essa configuração local não é necessária para a entrega Docker.

As responsabilidades da equipe estão em [RESPONSABILIDADES.md](RESPONSABILIDADES.md) e o fluxo de colaboração em [GIT_WORKFLOW.md](GIT_WORKFLOW.md).
