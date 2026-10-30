# Arquitetura do Bolsa Analytics

O Bolsa Analytics é uma aplicação acadêmica organizada em um único repositório, com backend Python e frontend React separados. Esta primeira etapa fornece somente a estrutura inicial: uma página de apresentação e um endpoint de saúde. As funcionalidades financeiras serão desenvolvidas depois.

## Estado atual

- **Backend:** FastAPI com `GET /health`, CORS para desenvolvimento local e diretórios reservados para as próximas camadas.
- **Frontend:** React, TypeScript e Vite, com Tailwind CSS e uma página inicial temporária.
- **Bibliotecas e recursos:** Pandas e yfinance no backend; Recharts no frontend. Os ícones do frontend são SVGs locais do Phosphor, sob licença MIT, com os avisos em `THIRD_PARTY_NOTICES.md`.
- **Persistência:** não há banco de dados nem cache funcional.
- **Acesso:** não há autenticação ou tela de login.

## Separação de responsabilidades

| Diretório | Responsabilidade |
| --- | --- |
| `backend/app/main.py` | Inicialização da aplicação FastAPI e configuração de CORS. |
| `backend/app/routes/` | Rotas HTTP. Na base inicial, somente a verificação de saúde está implementada. |
| `backend/app/services/` | Espaço reservado para coordenar consultas e regras de negócio futuras. |
| `backend/app/processing/` | Espaço reservado para limpeza, transformação e cálculos com Pandas. |
| `backend/app/providers/` | Espaço reservado para adaptar fontes externas ao backend. |
| `backend/app/cache/` | Espaço reservado para uma eventual estratégia de cache; não representa um banco de dados. |
| `backend/tests/` | Espaço reservado para testes do backend. |
| `frontend/src/components/layout/` | Estrutura visual, cabeçalho e navegação. |
| `frontend/src/components/ui/` | Componentes visuais reutilizáveis. |
| `frontend/src/components/charts/` | Espaço reservado para gráficos que receberão dados por props. |
| `frontend/src/pages/` | Composição das páginas da aplicação. |
| `frontend/src/services/` | Espaço reservado para chamadas HTTP ao backend. |
| `frontend/src/hooks/` | Espaço reservado para hooks de consulta e integração. |
| `frontend/src/types/` | Espaço reservado para tipos TypeScript e contratos de integração acordados pela equipe. |
| `frontend/src/styles/` e `frontend/src/assets/` | Estilos globais e recursos visuais. |

## Fluxo financeiro planejado

O fluxo abaixo é uma orientação para a próxima etapa e ainda não está implementado:

```text
Fonte financeira
    → provider do backend
    → service, que coordena a consulta e o processamento
    → processing com Pandas
    → rota FastAPI com resposta JSON padronizada
    → service HTTP e hook do frontend
    → página que entrega os dados por props
    → componente de gráfico
```

Os providers deverão concentrar os detalhes de cada fonte. Os services coordenarão os providers e o processamento, enquanto as rotas cuidarão da interface HTTP. A camada `processing` tratará os dados antes da serialização em JSON; objetos internos de Pandas não serão um contrato direto com os componentes React.

No frontend, Pedro desenvolverá os services HTTP, hooks e a ligação com as páginas. Williane desenvolverá os gráficos e seus filtros de apresentação com dados recebidos por props. Esses componentes não precisarão conhecer a biblioteca usada para obter os dados financeiros.

Os tipos, nomes de campos, formatos de datas, unidades e tratamento de erros serão definidos em conjunto antes da implementação de cada integração. Esta base não estabelece contratos financeiros antecipadamente.

## Fontes e expansão previstas

A fonte principal planejada é o `yfinance`. O projeto pretende trabalhar futuramente com B3, dólar comercial (USD/BRL), mini dólar futuro (WDO), ouro e Bitcoin.

A disponibilidade de cada instrumento, símbolo e histórico precisará ser validada na etapa de integração. Não há promessa de que todos esses mercados sejam atendidos pelo yfinance. Para WDO, poderá ser criado outro provider no diretório correspondente; essa separação permitirá acrescentar uma fonte sem reorganizar as camadas do sistema ou acoplar os gráficos à origem dos dados.

## Configuração local

O arquivo `.env` fica na raiz do repositório e deve ser criado a partir de `.env.example`. Ele não deve ser versionado.

- `FRONTEND_ORIGIN`: origem única permitida pelo CORS. O padrão é `http://localhost:5173`.
- `VITE_API_BASE_URL`: endereço reservado para a futura integração HTTP do frontend. O valor inicial é `http://127.0.0.1:8000`; a página temporária não o utiliza para fazer consultas.

O Vite usa `envDir: '..'` para ler o arquivo da raiz. Variáveis com prefixo `VITE_` ficam disponíveis no código do navegador e não devem conter segredos.

O backend consulta `FRONTEND_ORIGIN` com `os.getenv`. Para carregar o arquivo da raiz, execute a partir de `backend/`:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --env-file ../.env
```

O suporte a esse carregamento é fornecido pela dependência declarada `python-dotenv`. Sem um arquivo carregado ou uma variável de ambiente definida, a configuração de CORS usa a origem padrão. O CORS autoriza `GET`, sem credenciais; novas necessidades deverão ser configuradas quando houver novas rotas. `localhost` e `127.0.0.1` representam origens diferentes para o navegador, assim como portas diferentes.

## Evolução da base

Cada nova funcionalidade deverá manter a separação entre fonte, processamento, HTTP e apresentação. Antes de integrar código, a equipe deverá combinar as props dos gráficos, os tipos compartilhados e os arquivos de composição que precisarão mudar. A divisão por integrante está em [RESPONSABILIDADES.md](RESPONSABILIDADES.md), o contrato atualmente disponível em [API.md](API.md) e o processo de integração em [GIT_WORKFLOW.md](GIT_WORKFLOW.md).
