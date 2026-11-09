# Bolsa Analytics

Plataforma acadêmica de análise e visualização de dados do mercado financeiro, desenvolvida por Pedro, Natan e Williane em um único repositório.

O frontend oferece um terminal financeiro com gráficos, comparação, tendências, cotações intradiárias e áreas de usuário e administração, com layout inspirado no OpenTerminal e identidade Bolsa Analytics. Mantém React, TypeScript, Vite, Tailwind e Recharts; Lightweight Charts atende aos candles e gráficos financeiros interativos. Os ícones são SVGs locais, com base no Phosphor, sem Lucide.

**Novos recursos:** login/cadastro, perfil, favoritos e configurações persistidos em SQLite; dashboard administrativo protegido; análise de tendência com algoritmo em português, filtros, médias móveis, regressão, correlação e projeções. Veja [Tendências e contas](docs/TENDENCIAS_E_CONTAS.md) para a metodologia e os comandos de criação do administrador. Não existe senha padrão.

**Dados de mercado:** as páginas principais consultam o FastAPI, que obtém OHLCV do Yahoo Finance por yfinance. Não há confirmação de tempo real. Petrobras, Vale, Ibovespa, dólar à vista USD/BRL, euro EUR/BRL, libra GBP/BRL, iene JPY/BRL, ouro futuro GC=F e Bitcoin são os ativos integrados. Moeda, unidade e fuso efetivo acompanham as respostas. WDO não está disponível.

**Laboratório preservado:** em `/graficos`, o botão “Laboratório com séries simuladas” abre os componentes originais com PETR4, VALE3 e ITUB4, filtros de 7/30/90 dias, média, indicadores, comparação e tabela. Somente esse laboratório utiliza as séries locais simuladas, encerradas em 26/10/2026.

## Executar com Docker — entrega ao professor

Requisitos: Git, Docker com o Compose instalado e em execução, acesso à internet e a porta 8081 disponível. No Windows e no macOS, utilize o Docker Desktop; no Windows, mantenha o modo de contêineres Linux habilitado. No Linux, pode ser utilizado Docker Engine com o plugin Compose. Python, Node.js e as dependências são instalados dentro das imagens; não é necessário instalá-los na máquina nem criar `.env`.

```bash
git clone https://github.com/pedrocorreiadev/Bolsa-Analytics.git
cd Bolsa-Analytics
docker compose up --build -d
```

A primeira execução baixa as imagens e dependências e pode levar alguns minutos. As imagens base estão fixadas por digest; o frontend usa `package-lock.json` e o backend utiliza `requirements.txt` com as versões transitivas fixadas em `requirements.lock.txt`. O build executa os testes do backend, a análise de código, os testes e a compilação do frontend; uma falha interrompe a construção. A execução utiliza FastAPI/Uvicorn e o frontend compilado servido por Nginx.

Depois da inicialização, abra:

- Aplicação: [http://localhost:8081](http://localhost:8081).
- Saúde da API pelo proxy: [http://localhost:8081/health](http://localhost:8081/health).
- Documentação da API: [http://localhost:8081/docs](http://localhost:8081/docs).

O site e a API usam o mesmo endereço. O backend fica na rede do Compose, sem ocupar a porta 8000 da máquina; a porta 5173 do desenvolvimento também permanece independente. As rotas `/mercado`, `/graficos`, `/candles` e `/comparacao` podem ser abertas diretamente ou recarregadas. O Compose só inicia o Nginx após o backend ficar saudável; o proxy resolve novamente o endereço da API quando seu contêiner é recriado.

Para conferir a inicialização, execute `docker compose ps`: os dois serviços devem aparecer como `healthy` após alguns segundos. Essa verificação confirma o funcionamento da aplicação e da comunicação entre os serviços, sem depender de uma consulta ao Yahoo Finance.

```bash
docker compose ps
docker compose logs --tail=100
```

Para acompanhar os logs continuamente, use `docker compose logs -f`. Para encerrar:

```bash
docker compose down
```

Depois de atualizar o código com `git pull`, execute novamente `docker compose up --build -d`. O SQLite é preparado automaticamente no volume `bolsa-data`, que preserva contas e preferências entre reinícios. Não há banco externo a instalar nem pastas locais para montar nos contêineres.

Se a porta 8081 estiver ocupada, crie ou edite um `.env` na raiz com `BOLSA_PORT=8082`, execute o mesmo comando e abra `http://localhost:8082`. Esse arquivo é opcional; as variáveis do desenvolvimento local não sobrescrevem a URL da API compilada no Docker.

**Dados financeiros:** o backend precisa conseguir acessar o Yahoo Finance pela internet. Uma restrição da rede, limite ou indisponibilidade da fonte pode impedir consultas mesmo com os serviços saudáveis; a interface informa o erro e oferece uma nova tentativa. Os testes usam mocks e o laboratório simulado continua disponível independentemente da fonte.

## Páginas

| Rota | Conteúdo |
| --- | --- |
| `/` | Panorama dos ativos, últimos fechamentos e atalhos |
| `/mercado` | Busca, filtros de classe/variação, ordenação e acesso às análises |
| `/graficos` | Evolução de preços da API e laboratório simulado opcional |
| `/candles` | OHLCV, volume disponível, período/intervalo, crosshair, zoom e deslocamento |
| `/comparacao` | Dois ativos, variação no período comum, base 100, preços compatíveis, candles sincronizados e estatísticas |
| `/tendencias` | Médias móveis, regressão, estatísticas, correlação, filtros por data e projeções |
| `/cotacoes` | Cotações intradiárias de um minuto, atualização automática e horário da fonte |
| `/login` | Entrada e cadastro de usuário |
| `/conta` | Área pessoal e acompanhamento de favoritos |
| `/perfil` | Perfil e alteração de senha |
| `/configuracoes` | Preferências de análise, favoritos e atualização do panorama |
| `/admin` | Usuários, coleta, qualidade e cache; acesso exclusivo do administrador |

Seleções ficam na URL, por exemplo `/candles?ativo=petrobras&periodo=3mo&intervalo=1wk` e `/comparacao?primeiro=petrobras&segundo=vale&periodo=1mo&intervalo=1d`. A comparação usa apenas as datas presentes nos dois históricos, sem preencher lacunas. Preços só são sobrepostos quando moeda e unidade coincidem. Cada mercado mantém seu calendário/fuso; datas iguais não significam fechamentos simultâneos.

O roteamento usa a History API do navegador. Vite, seu preview e o Nginx incluído no Docker atendem links diretos. Em outra hospedagem estática, configure o fallback de rotas para `index.html`.

## Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Backend | Python 3.12+, FastAPI, Uvicorn, Pydantic |
| Dados | Pandas e yfinance |
| Frontend | React, TypeScript, Vite e Tailwind CSS |
| Visualizações | Recharts, Lightweight Charts e ícones SVG locais do Phosphor |
| Colaboração | Git, GitHub e Pull Requests |

O `python-dotenv` permite ao Uvicorn carregar a configuração local com `--env-file`. SQLite persiste contas, preferências e sessões. A plataforma não executa operações financeiras.

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
│   │   ├── routes/           # Saúde, catálogo de ativos e históricos
│   │   ├── services/         # Orquestração das consultas e respostas
│   │   ├── processing/       # Validação e tratamento de OHLCV
│   │   ├── providers/        # Consulta ao Yahoo Finance via yfinance
│   │   └── cache/            # Cache de consultas e métricas de coleta
│   ├── tests/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── requirements.lock.txt
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
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── nginx.conf
│   ├── tsconfig.json        # E configurações específicas do template Vite
│   └── vite.config.ts
├── docs/
│   ├── ARQUITETURA.md
│   ├── RESPONSABILIDADES.md
│   ├── GIT_WORKFLOW.md
│   └── API.md
├── .gitignore
├── .env.example
├── compose.yaml
└── README.md
```

Pacotes Python contêm `__init__.py`. Diretórios ainda vazios contêm `.gitkeep` para serem preservados pelo Git. Ambientes locais, dependências instaladas e arquivos gerados ficam fora do versionamento.

## Preparação para execução local sem Docker

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

O `.env` local define `FRONTEND_ORIGIN=http://localhost:5173`, usado pelo CORS do backend, e `API_PROXY_TARGET=http://127.0.0.1:8000`, destino do proxy do Vite. O navegador usa `/api` na mesma origem para preservar os cookies da sessão. O Vite lê o `.env` da raiz; configurações antigas de `VITE_API_BASE_URL` com URL local ainda são aceitas como destino do proxy. Variáveis com prefixo `VITE_` são públicas no navegador.

## Executar o backend sem Docker

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

## Executar o frontend sem Docker

Em outro terminal, a partir da raiz:

```bash
cd frontend
npm ci
npm run dev
```

Abra [http://localhost:5173](http://localhost:5173). Mantenha o backend em execução para os dados de mercado. Se a API ou a fonte falhar, a interface mostra o erro e permite tentar novamente; não substitui dados reais por séries artificiais. O laboratório simulado funciona independentemente da API.

Use a navegação para alternar páginas e o seletor superior para escolher um ativo do catálogo da API; clique em “Ver ativo” para encontrá-lo no mercado ou em “Ver todos” para abrir o catálogo completo. A página Mercado também permite selecionar um ativo, junto aos filtros de classe e variação.

A barra lateral expandida apresenta o pulso dos últimos fechamentos (altas, baixas e estáveis), um bloco de câmbio com dólar, euro, libra e iene cotados em reais, os desempenhos extremos no histórico diário de um mês e uma lista de acompanhamento dos demais ativos com acesso aos candles. O câmbio exibe a cotação por unidade da moeda, a variação entre os dois últimos fechamentos e a data do último registro. Esses resumos compartilham as consultas da visão geral. Rankings ainda em carregamento são identificados como parciais, e históricos indisponíveis não são tratados como variação zero. As datas podem variar entre mercados, sem confirmação de tempo real.

Nos gráficos, arraste para deslocar e use rolagem ou pinça para zoom. Com foco no gráfico, as setas percorrem sessões, Shift+setas deslocam, +/− ajustam o zoom e 0 ajusta todo o histórico. Seletores, ações e tabelas têm foco visível; tabelas extensas mantêm rolagem própria.

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

Os comandos de criação, sincronização, commit, push e Pull Request estão em [Fluxo Git](docs/GIT_WORKFLOW.md). Combine mudanças em arquivos compartilhados antes de editá-los. Os componentes recebem históricos por props; serviços e hooks centralizam a integração e compartilham consultas por até 60 segundos. O panorama pode ter atualização automática configurada na conta; cotações intradiárias têm controle próprio.

Para validar o backend, execute em `backend/`: `.\.venv\Scripts\python.exe -m unittest discover -s tests -v`. Os testes usam mocks e bancos temporários, sem dependência de disponibilidade do Yahoo Finance. Veja os contratos em [API](docs/API.md), os recursos de [Tendências e contas](docs/TENDENCIAS_E_CONTAS.md) e os avisos de licenças em [Recursos de terceiros](THIRD_PARTY_NOTICES.md). A plataforma não executa operações financeiras.

Referências de configuração: [Vite](https://vite.dev/guide/), [Tailwind com Vite](https://tailwindcss.com/docs/installation/using-vite) e [CORS no FastAPI](https://fastapi.tiangolo.com/tutorial/cors/).
