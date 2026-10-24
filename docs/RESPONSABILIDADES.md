# Responsabilidades da equipe

Os três integrantes trabalham na mesma aplicação e no mesmo repositório. As branches abaixo são o fluxo de trabalho previsto; a entrega desta estrutura não cria nem publica essas branches.

| Integrante | Branch prevista | Área principal |
| --- | --- | --- |
| Pedro | `feature/backend` | Backend e integração entre API e frontend. |
| Natan | `feature/ui` | Interface, layout e identidade visual. |
| Williane | `feature/charts` | Gráficos e apresentação dos dados. |

## Pedro — backend e integração

Diretórios principais:

- `backend/app/` e suas camadas `routes/`, `services/`, `processing/`, `providers/` e `cache/`.
- `backend/tests/` e `backend/requirements.txt`.
- `frontend/src/services/`, `frontend/src/hooks/` e tipos de integração em `frontend/src/types/`.

Na próxima etapa, Pedro será responsável por consultar as fontes financeiras, tratar e limpar dados com Pandas, desenvolver cálculos e indicadores, definir os endpoints e padronizar suas respostas JSON. Também configurará os providers, inclusive uma possível fonte específica para WDO.

No frontend, Pedro desenvolverá as chamadas HTTP e os hooks de consulta, e conectará os dados aos componentes de Williane por meio das páginas e das props combinadas com a equipe. O frontend não fará chamadas diretas ao yfinance.

Nesta base, essas áreas estão apenas preparadas; não há coleta financeira ou integração implementada.

## Natan — interface visual

Diretórios principais:

- `frontend/src/components/layout/`.
- `frontend/src/components/ui/`.
- `frontend/src/pages/`.
- `frontend/src/styles/` e `frontend/src/assets/`.

Natan será responsável pela identidade visual, layout das páginas, cabeçalho, navegação, componentes visuais reutilizáveis, cores, tipografia, espaçamentos, responsividade e organização do futuro dashboard.

Natan coordenará com Pedro a composição das páginas que consomem dados e com Williane os espaços destinados aos gráficos. A lógica de coleta e os componentes de gráficos pertencem às respectivas áreas de integração e visualização.

A página atual é temporária e serve apenas para confirmar o funcionamento do frontend; ela não define o design definitivo.

## Williane — gráficos e visualizações

Diretório principal: `frontend/src/components/charts/`.

Williane será responsável pelos componentes de gráficos, sua interatividade, filtros de visualização e componentes de comparação. Estão previstos, para etapas futuras, gráficos de linhas, volume, indicadores e candlesticks quando aplicável. A adequação da biblioteca e de cada representação será verificada na implementação; não há gráficos prontos nesta base.

Os componentes deverão receber dados e configurações por props. Williane combinará com Pedro os tipos necessários para essa interface e com Natan o encaixe dos componentes no layout. Filtros que alterem a consulta deverão comunicar a seleção por callbacks acordados com Pedro; a obtenção dos dados ficará nos services e hooks de integração.

Criar APIs, consultar fontes e conectar diretamente o frontend ao yfinance não faz parte dessa responsabilidade.

## Arquivos e decisões compartilhados

Os diretórios representam áreas prioritárias, não permissões exclusivas. Antes de editar um arquivo usado por mais de uma área, avisem os demais e combinem quem fará a alteração.

| Arquivo ou área | Coordenação necessária |
| --- | --- |
| `frontend/src/App.tsx`, `main.tsx` e `pages/` | Natan organiza a composição visual; Pedro coordena a ligação com dados; Williane informa as props necessárias aos gráficos. |
| `frontend/src/types/` | Pedro coordena os contratos de integração, com revisão de Williane para os dados dos gráficos e de Natan para o uso nas páginas. |
| `frontend/package.json` e arquivo de lock | Combinar adições e atualizações de dependências e manter manifesto e lock consistentes. |
| Configurações Vite, TypeScript e Tailwind | Combinar mudanças que afetem build, execução ou estilos globais. |
| `.env.example`, `.gitignore`, `README.md` e `docs/` | Atualizar a documentação e os exemplos junto com a mudança correspondente; nunca incluir segredos. |
| Contratos da API e props dos gráficos | Definir campos, unidades, datas e estados de carregamento/erro antes da integração. |

Trabalhem com commits pequenos e Pull Requests de escopo claro. A criação das branches a partir de uma base comum, a sincronização e a resolução de conflitos estão descritas em [GIT_WORKFLOW.md](GIT_WORKFLOW.md).
