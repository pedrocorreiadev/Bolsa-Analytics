# API do Bolsa Analytics

O backend FastAPI consulta a fonte já utilizada pelo projeto, Yahoo Finance via `yfinance`, e prepara séries OHLCV com Pandas. Não há autenticação, persistência ou execução de operações. A disponibilidade depende da fonte e da conectividade; as respostas não garantem dados em tempo real.

## Executar

A partir de `backend/`, com as dependências instaladas conforme o [README](../README.md):

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --env-file ../.env
```

Base local: `http://127.0.0.1:8000`. Documentação automática em `/docs`, `/redoc` e `/openapi.json`.

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

Intraday não é oferecido nesta versão. Uma combinação aceita pode não ter registros disponíveis na fonte para determinado instrumento.

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

`FRONTEND_ORIGIN` no `.env` da raiz define a origem autorizada, por padrão `http://localhost:5173`. A configuração permite `GET`, sem credenciais. `localhost` e `127.0.0.1` são origens diferentes para o navegador. Reinicie o backend ao mudar a configuração.

## Verificar sem rede

Os testes usam `unittest`, mocks e chamadas ASGI em memória, sem instalar um cliente HTTP adicional e sem consultar a fonte:

```powershell
cd backend
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

Referência técnica da fonte: [parâmetros e intervalos do yfinance](https://ranaroussi.github.io/yfinance/reference/api/yfinance.download.html).
