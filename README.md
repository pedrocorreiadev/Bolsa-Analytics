# Bolsa Analytics

Plataforma acadêmica de análise e visualização de dados do mercado financeiro, desenvolvida por Pedro, Natan e Williane em um único repositório.

O frontend oferece um terminal financeiro em cinco páginas, com layout inspirado no OpenTerminal e identidade Bolsa Analytics. Mantém React, TypeScript, Vite, Tailwind e Recharts; Lightweight Charts atende aos candles e gráficos financeiros interativos. Os ícones são SVGs locais do Phosphor, sem Lucide.

**Dados de mercado:** as páginas principais consultam o FastAPI, que obtém OHLCV do Yahoo Finance por yfinance. Não há confirmação de tempo real. Petrobras, Vale, Ibovespa, dólar à vista USD/BRL, ouro futuro GC=F e Bitcoin são os ativos integrados. Moeda, unidade e fuso efetivo acompanham as respostas. WDO não está disponível.

**Laboratório preservado:** em `/graficos`, o botão “Laboratório com séries simuladas” abre os componentes originais com PETR4, VALE3 e ITUB4, filtros de 7/30/90 dias, média, indicadores, comparação e tabela. Somente esse laboratório utiliza as séries locais simuladas, encerradas em 26/10/2026.

## Páginas

| Rota | Conteúdo |
| --- | --- |
| `/` | Panorama dos ativos, últimos fechamentos e atalhos |
| `/mercado` | Busca, filtros de classe/variação, ordenação e acesso às análises |
| `/graficos` | Evolução de preços da API e laboratório simulado opcional |
| `/candles` | OHLCV, volume disponível, período/intervalo, crosshair, zoom e deslocamento |
| `/comparacao` | Dois ativos, variação no período comum, base 100, preços compatíveis, candles sincronizados e estatísticas |

Seleções ficam na URL, por exemplo `/candles?ativo=petrobras&periodo=3mo&intervalo=1wk` e `/comparacao?primeiro=petrobras&segundo=vale&periodo=1mo&intervalo=1d`. A comparação usa apenas as datas presentes nos dois históricos, sem preencher lacunas. Preços só são sobrepostos quando moeda e unidade coincidem. Cada mercado mantém seu calendário/fuso; datas iguais não significam fechamentos simultâneos.

O roteamento usa a History API do navegador. Vite e seu preview atendem links diretos. Em uma futura hospedagem estática, configure o fallback de rotas para `index.html`.

## Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Backend | Python 3.12+, FastAPI, Uvicorn, Pydantic |
| Dados | Pandas e yfinance |
| Frontend | React, TypeScript, Vite e Tailwind CSS |
| Visualizações | Recharts, Lightweight Charts e ícones SVG locais do Phosphor |
| Colaboração | Git, GitHub e Pull Requests |

O `python-dotenv` permite ao Uvicorn carregar a configuração local com `--env-file`. Não há banco de dados, autenticação ou execução de operações.

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

Instale Python 3.12 ou superior, Node.js 24 ou superior e Git. Os testes frontend utilizam o suporte nativo a TypeScript do Node.js 24, sem adicionar um executor de testes.

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

O `.env` local define `FRONTEND_ORIGIN=http://localhost:5173`, usado pelo CORS do backend, e `VITE_API_BASE_URL=http://127.0.0.1:8000`, utilizado pelo serviço HTTP do frontend. O Vite lê o `.env` da raiz. Variáveis com prefixo `VITE_` são públicas no navegador.

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

Abra [http://localhost:5173](http://localhost:5173). Mantenha o backend em execução para os dados de mercado. Se a API ou a fonte falhar, a interface mostra o erro e permite tentar novamente; não substitui dados reais por séries artificiais. O laboratório simulado funciona independentemente da API.

Use a navegação para alternar páginas e a busca superior para encontrar um ativo no mercado. Nos gráficos, arraste para deslocar e use rolagem ou pinça para zoom. Com foco no gráfico, as setas percorrem sessões, Shift+setas deslocam, +/− ajustam o zoom e 0 ajusta todo o histórico. Seletores, ações e tabelas têm foco visível; tabelas extensas mantêm rolagem própria.

A porta 5173 é fixa: se estiver ocupada, o Vite encerra com erro. Isso evita alterar a origem silenciosamente e invalidar o CORS. Use `localhost` ao abrir o frontend; `http://127.0.0.1:5173` é uma origem diferente e não está autorizada no backend por padrão.

Para validar o frontend:

```bash
npm run lint
npm test
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

Os comandos de criação, sincronização, commit, push e Pull Request estão em [Fluxo Git](docs/GIT_WORKFLOW.md). Combine mudanças em arquivos compartilhados antes de editá-los. Os componentes recebem históricos por props; serviços e hooks centralizam a integração e compartilham consultas por até 60 segundos, com atualização manual.

Para validar o backend, execute em `backend/`: `.\.venv\Scripts\python.exe -m unittest discover -s tests -v`. Os testes usam mocks, sem dependência de disponibilidade do Yahoo Finance. Veja os contratos em [API](docs/API.md) e os avisos de licenças em [Recursos de terceiros](THIRD_PARTY_NOTICES.md). Não há login, persistência ou execução de operações.

Referências de configuração: [Vite](https://vite.dev/guide/), [Tailwind com Vite](https://tailwindcss.com/docs/installation/using-vite) e [CORS no FastAPI](https://fastapi.tiangolo.com/tutorial/cors/).
