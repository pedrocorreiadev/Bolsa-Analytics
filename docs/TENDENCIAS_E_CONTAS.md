# Tendências, cotações e contas

## Recursos disponíveis

| Rota | Uso |
| --- | --- |
| `/tendencias` | Filtros por ativo, histórico, datas, janelas de médias e horizonte; estatística descritiva, correlação e projeções. |
| `/cotacoes` | Candles intradiários de um minuto, atualização a cada 1 ou 5 minutos ou pausada, horário e idade do último registro. |
| `/login` | Cadastro e entrada com e-mail e senha. |
| `/conta` | Área pessoal e favoritos com atalhos para análise. |
| `/perfil` | Nome, identificação do perfil e alteração de senha. |
| `/configuracoes` | Favoritos, ativo/período/horizonte iniciais e atualização automática do panorama. |
| `/admin` | Usuários, perfis de acesso, indicadores de coleta, últimos 50 eventos e limpeza do cache da API. |

As ferramentas de mercado são públicas. Perfil, configurações e área pessoal exigem sessão. A API verifica o papel administrativo em cada endpoint de administração. Ocultar um botão na interface não concede nem substitui a autorização no servidor.

## Criar o administrador

Não existe senha padrão. Cadastros pela interface recebem sempre o papel `usuario`; não é possível enviar um papel no cadastro ou na atualização do perfil.

Com o Docker em execução, na raiz:

```bash
docker compose exec backend python -m app.criar_admin --email admin@exemplo.com --nome Administrador
```

No desenvolvimento local, em `backend/`:

```powershell
.\.venv\Scripts\python.exe -m app.criar_admin --email admin@exemplo.com --nome Administrador
```

Use seu e-mail no comando. A senha é solicitada duas vezes sem exibição, com mínimo de 10 e máximo de 128 caracteres. Depois entre por `/login`. O comando cria uma conta nova; um e-mail já existente é recusado. `BOLSA_DB_PATH`, quando definido no ambiente do processo, deve apontar para o mesmo banco usado pelo servidor. Se a variável estiver apenas no `.env`, carregue-a no terminal antes de executar o comando; o caminho padrão já coincide com o servidor local e o Compose configura o caminho do contêiner.

## Persistência e sessão

O SQLite é criado automaticamente em `backend/data/bolsa.sqlite3`, fora do Git e do contexto Docker. No Compose, fica em `/app/data/bolsa.sqlite3`, dentro do volume `bolsa-data`. Contas e preferências sobrevivem a reinícios e a `docker compose down`; remover o volume elimina esses dados. Faça backup desse banco antes de trocar a instalação.

As senhas usam PBKDF2-HMAC-SHA256 com sal aleatório e 600 mil iterações. O cookie de sessão é `HttpOnly`, `SameSite=Lax`, com duração de 12 horas; apenas o hash do token é persistido. Login renova a sessão recebida; logout a revoga no servidor. A troca de senha exige a senha atual e encerra as outras sessões. Não há token em `localStorage`.

Mutações exigem `X-Bolsa-Client: web`, e a API aceita preflight apenas da origem configurada. Há limitação persistente de tentativas de login, cadastro e troca de senha. Em hospedagem HTTPS, configure `BOLSA_COOKIE_SECURE=true`. A versão atual não inclui envio de e-mail, recuperação de senha ou autenticação multifator.

O navegador usa `/api` na mesma origem do site. Em desenvolvimento e preview, Vite encaminha ao `API_PROXY_TARGET` (padrão `http://127.0.0.1:8000`); no Docker, Nginx encaminha ao backend. A configuração antiga `VITE_API_BASE_URL=http://...` ainda pode fornecer o destino do proxy, mas não é incorporada como origem do navegador. Hospedagens diferentes precisam de proxy equivalente.

## Algoritmo em português

O código principal está em [`backend/app/processing/tendencias.py`](../backend/app/processing/tendencias.py); as etapas são devolvidas pela API e exibidas na própria análise.

1. A coleta obtém OHLCV e preserva os metadados de origem. O tratamento remove datas inválidas, OHLC ausente ou inconsistente e duplicidades. Não preenche pregões nem cria preços artificiais.
2. As datas escolhidas recortam o histórico solicitado. Todos os cálculos usam apenas essa amostra, inclusive as médias móveis. É necessário ter pelo menos `max(10, janela_longa)` observações e fechamentos positivos.
3. Médias móveis simples descrevem as últimas observações. A janela curta deve ser menor que a longa; padrões: 5 e 20 observações.
4. Uma regressão linear por mínimos quadrados ajusta o logaritmo dos fechamentos contra a posição da observação. O log mantém os preços projetados positivos. A inclinação representa o crescimento relativo por observação e R² descreve o ajuste histórico.
5. A classificação de alta/baixa exige R² de pelo menos 0,20, inclinação além de ±0,01% e distância relativa entre média curta e longa além de ±0,10%, na mesma direção. Movimentos relevantes sem concordância são `mista`; os demais são `lateral`. São limiares heurísticos explícitos, sem calibração de probabilidade de acerto.
6. A estatística inclui média, mediana, extremos dos fechamentos, variação total, retorno médio, desvio padrão amostral dos retornos diários e queda máxima desde o pico dos fechamentos. Não há anualização presumindo calendário único para bolsa e cripto.
7. A correlação de Pearson utiliza retornos com as mesmas datas de início e fim nos dois ativos, sem preencher lacunas. São necessários pelo menos três pares e variância nos dois lados; indisponibilidade da referência não elimina a análise principal.
8. A projeção extrapola o ajuste para 5, 10 ou 20 observações. No espaço logarítmico, sua faixa ilustrativa é `ajuste ± 2 × desvio_residual × sqrt(1 + 1/n + (x_futuro − média_x)² / Sxx)`, convertida de volta para preço. Não representa um intervalo com cobertura probabilística validada para séries financeiras. Os passos não recebem datas de pregão futuras.

R² não significa chance de acerto. A regressão pode começar acima ou abaixo do último fechamento, pois ajusta a amostra inteira. Dividendos e desdobramentos podem afetar preços não ajustados (`auto_adjust=False`). Retornos além de três desvios são contados e mantidos, sem apagar movimentos reais. Projeções são cenários acadêmicos, sem garantia nem recomendação de investimento.

## Coleta e cotações

O cache da API dura até 60 segundos e compartilha consultas simultâneas da mesma chave `(ativo, período, intervalo)`. Erros não são armazenados como sucesso. O painel administrativo registra consultas à fonte, acertos de cache, falhas, quantidade de registros e duração. Contadores e eventos são do processo atual e reiniciam com a API; não são um histórico persistente nem agregação entre workers.

`/cotacoes` consulta `period=1d`, `interval=1m` e preserva timestamps com fuso. O valor é o fechamento do último candle de um minuto disponível. A variação é calculada contra a primeira abertura disponível na sessão, **não** contra o fechamento anterior. O gráfico mantém a moeda/unidade do ativo e informa separadamente o horário do candle e o horário da coleta. Mercados fechados ou atraso da fonte podem produzir registros antigos; atualização automática não garante novo preço.

O panorama usa os últimos fechamentos diários e pode atualizar a cada 1 ou 5 minutos nas configurações da conta. A atualização automática pausa em abas ocultas. As cotações intradiárias têm controle próprio de atualização.

**Tempo real depende de um feed que forneça esse serviço.** A integração atual com Yahoo Finance/yfinance não oferece essa garantia. Uma futura fonte contratada pode substituir a coleta preservando os timestamps e contratos da interface.

## Validação

Em `backend/`: `.\.venv\Scripts\python.exe -m unittest discover -s tests -v`. Os testes cobrem contas, permissões, isolamento, sessões, tratamento, tendências conhecidas, filtros sem vazamento de datas, correlação, projeções e cache concorrente, sem consultar a rede.

Em `frontend/`: `npm run lint`, `npm test` e `npm run build`. A disponibilidade real da fonte é uma verificação separada; falhas são exibidas e não substituídas por dados simulados.

Referências: [mínimos quadrados e limitações de extrapolação — NIST](https://www.itl.nist.gov/div898/handbook/pmd/section1/pmd141.htm), [armazenamento de senhas — OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) e [sessões — OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).
