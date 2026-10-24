# API do Bolsa Analytics

O backend utiliza FastAPI. Nesta etapa, o único endpoint de aplicação implementado é a verificação de saúde. Não há endpoints financeiros, consultas a fontes externas ou cálculos de indicadores.

## Endereço de desenvolvimento

```text
http://127.0.0.1:8000
```

Execute a aplicação a partir de `backend/`, com o ambiente Python e as dependências preparados conforme o [README](../README.md):

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --env-file ../.env
```

## `GET /health`

Verifica se a aplicação está respondendo. Não exige autenticação, parâmetros, corpo de requisição ou acesso a uma fonte financeira.

**Resposta:** HTTP `200 OK`, conteúdo JSON.

```json
{"status":"ok"}
```

Exemplo em PowerShell:

```powershell
Invoke-RestMethod -Method Get -Uri http://127.0.0.1:8000/health
```

Também é possível abrir `http://127.0.0.1:8000/health` no navegador. Uma resposta de saúde confirma apenas que a aplicação respondeu; ela não verifica disponibilidade de mercados, providers ou dados.

## Documentação automática do FastAPI

O framework disponibiliza as seguintes interfaces automáticas:

- Swagger UI: `http://127.0.0.1:8000/docs`.
- ReDoc: `http://127.0.0.1:8000/redoc`.
- Esquema OpenAPI: `http://127.0.0.1:8000/openapi.json`.

Esses recursos documentam a aplicação e não representam endpoints financeiros adicionais.

## CORS e configuração

A origem autorizada para o frontend é definida por `FRONTEND_ORIGIN` no `.env` da raiz, carregado pelo comando de inicialização acima. O padrão é `http://localhost:5173`.

A configuração inicial permite `GET`, sem credenciais. Para executar o frontend em outra origem, ajuste `FRONTEND_ORIGIN` e reinicie o backend. Origem inclui protocolo, host e porta; `http://localhost:5173` e `http://127.0.0.1:5173` são origens diferentes. CORS trata o acesso pelo navegador e não constitui autenticação da API.

## Estrutura financeira planejada

A evolução prevista segue as camadas de `providers/`, `services/`, `processing/` e `routes/`. Os providers obterão os dados; services coordenarão as consultas e o processamento com Pandas; as rotas publicarão respostas JSON para os services HTTP e hooks do frontend.

Os nomes de rotas, parâmetros, símbolos, formatos de resposta e tratamento de erros financeiros serão definidos quando cada funcionalidade for desenvolvida. Nenhum desses contratos está implementado ou prometido nesta etapa. O uso de yfinance é planejado; o suporte a cada instrumento será verificado, e WDO poderá utilizar outra fonte por meio de um provider próprio.

Consulte [ARQUITETURA.md](ARQUITETURA.md) para a separação das camadas e [RESPONSABILIDADES.md](RESPONSABILIDADES.md) para a divisão de implementação e integração.
