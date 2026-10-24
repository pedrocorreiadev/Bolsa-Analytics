# Bolsa Analytics

Plataforma acadêmica de análise e visualização de dados do mercado financeiro, desenvolvida por Pedro, Natan e Williane em um único repositório.

Esta primeira etapa prepara a estrutura de trabalho da equipe: frontend com uma página temporária, backend com verificação de saúde e documentação. As análises, fontes de dados e visualizações serão implementadas nas próximas etapas.

Os mercados previstos são a bolsa brasileira (B3), dólar comercial (USD/BRL), mini dólar futuro (WDO), ouro e Bitcoin. A fonte principal planejada é o `yfinance`; WDO poderá exigir um provedor específico, cuja integração ficará isolada na camada de fontes de dados.

## Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Backend | Python 3.12+, FastAPI, Uvicorn, Pydantic |
| Dados, para uso futuro | Pandas e yfinance, já declarados nas dependências |
| Frontend | React, TypeScript, Vite e Tailwind CSS |
| Visualizações, para uso futuro | Recharts e Lucide React, já declarados nas dependências |
| Colaboração | Git, GitHub e Pull Requests |

O `python-dotenv` permite ao Uvicorn carregar a configuração local com `--env-file`. Não há banco de dados, autenticação ou funcionalidades financeiras nesta etapa.

## Equipe

| Integrante | Responsabilidade principal | Branch |
| --- | --- | --- |
| Pedro | Backend, fontes, processamento, API e integração via serviços/hooks React | `feature/backend` |
| Natan | Identidade visual, layout, navegação, componentes de interface e responsividade | `feature/ui` |
| Williane | Gráficos, filtros visuais e comparações; componentes alimentados por props | `feature/charts` |

A divisão por diretórios e os pontos compartilhados estão em [Responsabilidades](docs/RESPONSABILIDADES.md).

## Estrutura

```text
Bolsa-Analytics/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── routes/           # Rotas HTTP; apenas /health nesta etapa
│   │   ├── services/         # Orquestração futura dos casos de uso
│   │   ├── processing/       # Tratamento e cálculos futuros
│   │   ├── providers/        # Adaptadores futuros de fontes financeiras
│   │   └── cache/            # Reservado para cache; sem implementação
│   ├── tests/
│   └── requirements.txt
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   ├── ui/
│   │   │   └── charts/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── types/
│   │   ├── styles/
│   │   ├── assets/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json        # E configurações específicas do template Vite
│   └── vite.config.ts
├── docs/
│   ├── ARQUITETURA.md
│   ├── RESPONSABILIDADES.md
│   ├── GIT_WORKFLOW.md
│   └── API.md
├── .gitignore
├── .env.example
└── README.md
```

Pacotes Python contêm `__init__.py`. Diretórios ainda vazios contêm `.gitkeep` para serem preservados pelo Git. Ambientes locais, dependências instaladas e arquivos gerados ficam fora do versionamento.

## Preparação

Instale Python 3.12 ou superior, Node.js 22.12 ou superior e Git. Node.js 24 é uma opção compatível para o desenvolvimento.

```bash
git clone https://github.com/pedrocorreiadev/Bolsa-Analytics.git
cd Bolsa-Analytics
```

Na raiz, copie o exemplo de configuração. No PowerShell:

```powershell
Copy-Item .env.example .env
```

No Linux/macOS:

```bash
cp .env.example .env
```

O `.env` local define `FRONTEND_ORIGIN=http://localhost:5173`, usado pelo CORS do backend. `VITE_API_BASE_URL=http://127.0.0.1:8000` está reservado à integração futura; a página temporária ainda não consulta a API. O Vite está configurado para ler o `.env` da raiz. Variáveis com prefixo `VITE_` são públicas no navegador.

## Executar o backend

Em um terminal separado, a partir da raiz, no PowerShell:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --env-file ../.env
```

Os comandos usam diretamente o Python do ambiente virtual, sem exigir ativação ou mudança na política de execução do PowerShell. Crie o ambiente apenas na primeira execução; reinstale as dependências quando `requirements.txt` mudar.

No Linux/macOS:

```bash
cd backend
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python -m uvicorn app.main:app --reload --env-file ../.env
```

O servidor atende em `http://127.0.0.1:8000`. Acesse:

- Saúde: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health), com resposta `{"status":"ok"}`.
- Documentação interativa automática: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

O endpoint confirma que a aplicação responde; não testa fontes financeiras. Veja o contrato em [API](docs/API.md).

## Executar o frontend

Em outro terminal, a partir da raiz:

```bash
cd frontend
npm ci
npm run dev
```

Abra [http://localhost:5173](http://localhost:5173). A página exibe **Bolsa Analytics** e a descrição da plataforma. O backend não precisa estar ligado para essa página temporária funcionar.

A porta 5173 é fixa: se estiver ocupada, o Vite encerra com erro. Isso evita alterar a origem silenciosamente e invalidar o CORS. Use `localhost` ao abrir o frontend; `http://127.0.0.1:5173` é uma origem diferente e não está autorizada no backend por padrão.

Para validar o frontend:

```bash
npm run lint
npm run build
```

Para visualizar o build localmente, execute `npm run preview` e abra o endereço informado pelo Vite. Esses comandos não publicam a aplicação.

O `package-lock.json` deve ser versionado. Use `npm ci` após clonar ou atualizar a branch; use `npm install` quando precisar alterar dependências e inclua o lock atualizado no mesmo Pull Request.

## Colaboração e próximas etapas

`main` representa a versão estável. Depois que esta base estiver integrada à `main`, os três integrantes devem criar suas branches a partir do mesmo commit inicial:

```text
main
├── feature/backend   → Pedro
├── feature/ui        → Natan
└── feature/charts    → Williane
```

Os comandos de criação, sincronização, commit, push e Pull Request estão em [Fluxo Git](docs/GIT_WORKFLOW.md). Combine mudanças em arquivos compartilhados antes de editá-los. A integração do frontend com a API será feita por Pedro; os gráficos da Williane receberão os dados por props.

Consulte também [Arquitetura](docs/ARQUITETURA.md) para a separação entre fontes, processamento, serviços, rotas e componentes. Esta base não realiza consultas financeiras nem contém dashboard definitivo, gráficos, login ou persistência.

Referências de configuração: [Vite](https://vite.dev/guide/), [Tailwind com Vite](https://tailwindcss.com/docs/installation/using-vite) e [CORS no FastAPI](https://fastapi.tiangolo.com/tutorial/cors/).
