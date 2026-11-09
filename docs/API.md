# API do Bolsa Analytics

O backend FastAPI consulta Yahoo Finance via `yfinance` e prepara séries OHLCV com Pandas. Inclui análise estatística, cotações intradiárias, contas/sessões persistidas em SQLite e endpoints administrativos protegidos. A disponibilidade depende da fonte e da conectividade; as respostas não garantem dados em tempo real. Não há execução de operações financeiras.

## Executar

A partir de `backend/`, com as dependências instaladas conforme o [README](../README.md):

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --env-file ../.env
```

Base local: `http://127.0.0.1:8000`. Documentação automática em `/docs`, `/redoc` e `/openapi.json`.

No Docker, execute `docker compose up --build -d` na raiz, sem preparar um `.env`. A API fica acessível pelo Nginx em `http://localhost:8081`, com os mesmos caminhos descritos abaixo, incluindo `/health` e `/docs`. A porta 8000 é interna aos contêineres. Veja os requisitos e comandos no [README](../README.md#executar-com-docker--entrega-ao-professor).

## `GET /health`

Retorna HTTP 200 com `{"status":"ok"}`. Confirma a resposta da aplicação, sem consultar a fonte financeira.

## `GET /api/assets`

Retorna o catálogo de instrumentos atendidos. Os campos originais `id` e `ticker` foram preservados; os demais são metadados aditivos.

| Campo | Tipo | Significado |
| --- | --- | --- |
| `id` | string | Identificador utilizado nas rotas de histórico. |
| `ticker` | string | Símbolo consultado na fonte. |
| `name` | string | Nome do instrumento em português. |
| `category` | string | Ações, Índices, Câmbio, Futuros ou Criptoativos. |
| `currency` | string | BRL ou USD; moeda de cotação dos preços monetários. |
| `unit` | string | `currency` para preços monetários; `points` para o índice. |
| `timezone` | null | O catálogo não faz uma consulta adicional para presumir o fuso. O histórico informa o fuso retornado pela fonte. |

| id | ticker | Instrumento | Unidade |
| --- | --- | --- | --- |
| `petrobras` | `PETR4.SA` | Petrobras | BRL |
| `vale` | `VALE3.SA` | Vale | BRL |
| `ibovespa` | `^BVSP` | Ibovespa | Pontos |
| `dolar` | `BRL=X` | Dólar à vista (USD/BRL) | BRL por USD |
| `euro` | `EURBRL=X` | Euro (EUR/BRL) | BRL por EUR |
| `libra` | `GBPBRL=X` | Libra esterlina (GBP/BRL) | BRL por GBP |
| `iene` | `JPYBRL=X` | Iene japonês (JPY/BRL) | BRL por JPY |
| `ouro` | `GC=F` | Ouro futuro (GC) | USD |
| `bitcoin` | `BTC-USD` | Bitcoin | USD |

O dólar à vista não representa um contrato WDO. Ouro utiliza o contrato futuro indicado pelo símbolo `GC=F`. WDO e ITUB4 não são atendidos por este catálogo; a demonstração local dos gráficos de linhas permanece separada da API.

## `GET /api/assets/{ativo}/history`

Consulta OHLCV com os parâmetros opcionais `period` e `interval`. Os valores padrão continuam sendo histórico de um mês e candles diários; chamadas antigas sem `interval` mantêm o comportamento anterior. Os preços continuam sendo obtidos com `auto_adjust=False`.

| Parâmetro | Padrão | Valores |
| --- | --- | --- |
| `period` | `1mo` | `5d`, `1mo`, `3mo`, `6mo`, `1y`, `2y`, `5y` |
| `interval` | `1d` | `1d`, `1wk`, `1mo` |

Os controles da aplicação oferecem um subconjunto explícito das combinações da fonte:

| Intervalo | Períodos aceitos |
| --- | --- |
| `1d` — diário | Todos os períodos acima. |
| `1wk` — semanal | Todos, exceto `5d`. |
| `1mo` — mensal | `3mo`, `6mo`, `1y`, `2y`, `5y`. |

Este endpoint preserva candles diários ou superiores. Para intradiário, use `/api/quotes/{ativo}`. Uma combinação aceita pode não ter registros disponíveis na fonte para determinado instrumento.

Exemplo de consulta, sem valores financeiros fictícios:

```powershell
Invoke-RestMethod -Uri 'http://127.0.0.1:8000/api/assets/petrobras/history?period=3mo&interval=1wk'
```

### Resposta

| Campo | Tipo | Significado |
| --- | --- | --- |
| `asset` | string | id do instrumento. |
| `ticker` | string | Símbolo da fonte. |
| `period` | string | Período solicitado. |
| `interval` | string | Intervalo solicitado. |
| `currency` | string | BRL ou USD, conforme o catálogo. |
| `unit` | string | `currency` ou `points`; use este campo ao formatar o Ibovespa. |
| `timezone` | string ou null | Fuso do índice temporal recebido do `yfinance`, quando disponível. |
| `source` | string | `Yahoo Finance / yfinance`. |
| `count` | inteiro | Quantidade de candles válidos em `data`. |
| `data` | array | Candles ordenados por data, sem duplicidades. |
| `collected_at` | string | Instante UTC da coleta bem-sucedida em ISO 8601. |
| `realtime` | boolean | `false`: não há garantia de tempo real. |
| `quality` | objeto | `received`, `valid` e `discarded`: recebidos, válidos e descartados/duplicados. |
| `cached` | boolean | Indica resposta do cache de até 60 segundos. |

Cada item de `data` preserva os campos originais:

| Campo | Tipo | Significado |
| --- | --- | --- |
| `date` | string | Data da sessão em `YYYY-MM-DD`, preservada no fuso da fonte. |
| `open` | número | Abertura. |
| `high` | número | Máxima. |
| `low` | número | Mínima. |
| `close` | número | Fechamento. |
| `volume` | inteiro ou null | Volume informado pela fonte. Zero é preservado; ausência ou valor inválido retorna null. |

As datas representam sessões diárias, semanais ou mensais, sem hora intradiária. O frontend deve formatar a data de calendário sem convertê-la para um instante UTC e deslocá-la para outro dia.

### Qualidade dos registros

O processamento trabalha sobre uma cópia dos dados. Datas inválidas, OHLC ausente/não numérico/infinito e candles com máxima ou mínima inconsistentes são descartados. Em duplicidades de data, permanece o último registro válido fornecido pela fonte. Volume negativo, ausente ou não finito é representado por null. A saída é ordenada por data; lacunas e sessões sem negociação não são preenchidas, e candles nunca são derivados apenas de fechamentos.

### Erros

Os erros retornam um objeto JSON com `detail`:

| Status | Situação |
| --- | --- |
| `400` | Período, intervalo ou combinação não permitidos. |
| `404` | Instrumento não atendido, ausência de dados ou ausência de OHLC válido. |
| `502` | Falha de conexão ou erro na fonte financeira. |

O provider limita cada chamada de histórico à fonte a dez segundos. A biblioteca pode fazer consultas auxiliares de sessão; erros de rede não são substituídos por dados simulados.

## CORS

`FRONTEND_ORIGIN` no `.env` da raiz define a origem autorizada, por padrão `http://localhost:5173`. Permite credenciais, métodos `GET`, `POST`, `PATCH`, `PUT` e cabeçalhos `Content-Type` e `X-Bolsa-Client`. `localhost` e `127.0.0.1` são origens diferentes. O frontend usa o proxy de mesma origem do Vite/Nginx. Reinicie o backend ao mudar a configuração.

## `GET /api/analysis/{ativo}`

| Parâmetro | Padrão | Regra |
| --- | --- | --- |
| `period` | `3mo` | Mesmo conjunto dos históricos; o intervalo é sempre diário. |
| `short` | `5` | Média móvel curta, de 2 a 199 observações. |
| `long` | `20` | Média longa, de 3 a 200; deve superar `short`. |
| `horizon` | `10` | De 1 a 20 observações futuras; a interface oferece 5, 10 e 20. |
| `start`, `end` | ausentes | Datas inclusivas `YYYY-MM-DD`, recortando o período consultado. |
| `benchmark` | ausente | id de outro ativo para correlação dos retornos. |

Requer pelo menos `max(10, long)` fechamentos positivos. Retorna identificação do ativo, `direcao` (`alta`, `baixa`, `lateral`, `mista`), `observacoes`, `inicio`, `fim`, janelas/horizonte, `estatisticas`, `serie`, `projecoes`, `correlacao`, `explicacao`, `avisos`, `qualidade`, `coletado_em` e `em_cache`. `tempo_real` é `false`.

`serie` contém `data`, `fechamento`, `media_curta`, `media_longa` e `ajuste`; médias sem janela completa são null. Cada projeção contém `passo`, `estimativa`, `inferior`, `superior`. `correlacao` inclui `ativo`, `valor` (null se não calculável), `pares` e `motivo`. Uma falha apenas na referência preserva a análise e informa o motivo. HTTP 400: filtros incompatíveis; 404: ativo/registro ausente; 422: dados ou parâmetros insuficientes/inválidos; 502: falha na fonte. A [metodologia completa](TENDENCIAS_E_CONTAS.md#algoritmo-em-português) descreve os limites das projeções.

## `GET /api/quotes/{ativo}`

Consulta um dia de candles de um minuto. Retorna `asset`, `ticker`, `name`, `currency`, `unit`, `timezone`, `source`, `interval`, `collected_at`, `as_of`, `count`, `quality`, `cached` e `data`. Cada ponto inclui `time` (ISO 8601 com fuso), `open`, `high`, `low`, `close`. `as_of` é a abertura do último candle recebido; `realtime` é `false`. Timestamp de coleta e timestamp do candle são distintos. A disponibilidade intradiária varia entre ativos e sessões. Erros usam 404 ou 502 conforme o histórico.

## Contas e autorização

Todas as mutações abaixo exigem o cabeçalho `X-Bolsa-Client: web`. O cookie `bolsa_sessao` é enviado pelo navegador com `credentials: include`. Não há token no corpo das respostas. As respostas de usuário incluem `id`, `nome`, `email`, `papel`, `criado_em` e `preferencias`.

| Método e rota | Corpo / resultado |
| --- | --- |
| `POST /api/auth/register` | `{nome, email, senha}`; 201 com usuário e cookie. Senha de 10–128 caracteres, nome de 2–80. Papel público sempre `usuario`. |
| `POST /api/auth/login` | `{email, senha}`; usuário e sessão de 12 horas. |
| `GET /api/auth/me` | Sessão obrigatória; usuário atual, `Cache-Control: no-store`. |
| `POST /api/auth/logout` | Revoga sessão, remove cookie, 204. |
| `PATCH /api/auth/profile` | Sessão obrigatória; `{nome}`; retorna usuário atualizado. |
| `PUT /api/auth/preferences` | Sessão obrigatória; `{ativo, periodo, horizonte, atualizacao, favoritos}`; retorna usuário atualizado. |
| `POST /api/auth/password` | Sessão obrigatória; `{senha_atual, nova_senha}`; 204, revoga outras sessões. |
| `GET /api/admin/dashboard` | Apenas admin; usuários sem hashes/sessões, totais e `coleta` com métricas e eventos. |
| `POST /api/admin/cache/clear` | Apenas admin; invalida cache do processo, 204. |

Preferências: `ativo` e `favoritos` usam o catálogo; `periodo` aceita períodos exceto `5d`; `horizonte`: 5, 10 ou 20; `atualizacao`: 0, 60 ou 300 segundos. Contas/preferências persistem em SQLite. Sessão ausente/expirada retorna 401, papel inadequado ou cabeçalho ausente retorna 403, e-mail duplicado retorna 409, validação retorna 422 e excesso de tentativas retorna 429 com `Retry-After`. O cadastro não aceita campos extras de papel ou permissões.

A criação do primeiro administrador é feita pelo [comando local](TENDENCIAS_E_CONTAS.md#criar-o-administrador), sem senha padrão. Em HTTPS, configure `BOLSA_COOKIE_SECURE=true`.

## Verificar sem rede

Os testes usam `unittest`, mocks e chamadas ASGI em memória, sem instalar um cliente HTTP adicional e sem consultar a fonte:

```powershell
cd backend
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

Referência técnica da fonte: [parâmetros e intervalos do yfinance](https://ranaroussi.github.io/yfinance/reference/api/yfinance.download.html).
