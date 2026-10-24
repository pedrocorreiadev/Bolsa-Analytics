# Fluxo de trabalho com Git e GitHub

O repositório é [pedrocorreiadev/Bolsa-Analytics](https://github.com/pedrocorreiadev/Bolsa-Analytics). Todos os integrantes trabalharão na mesma aplicação, usando Pull Requests para integrar alterações à `main`.

Os comandos deste documento são instruções para a equipe executar. A criação desta estrutura não executa push, merge ou criação das branches de trabalho.

## Preparar a base comum

A `main` será a versão principal e estável. No ponto de partida do projeto, ela contém somente o README. **Aguardem a estrutura inicial ser integrada à `main` antes de criar as três branches de trabalho.**

Após essa integração, a equipe deve escolher e registrar o SHA completo do commit da `main` que contém a estrutura inicial. Esse mesmo SHA será usado pelos três integrantes, mesmo que novos commits cheguem à `main` depois. Chamaremos esse valor de **SHA base comum**.

O responsável por registrar a base pode obter o SHA depois de atualizar sua `main`:

```powershell
git switch main
git pull --ff-only origin main
git rev-parse HEAD
```

Confiram que o commit escolhido contém `backend/`, `frontend/` e `docs/`, e compartilhem o SHA completo com a equipe antes de criar as branches.

## Clonar o repositório

Quem ainda não tiver uma cópia local deve executar:

```powershell
git clone https://github.com/pedrocorreiadev/Bolsa-Analytics.git
cd Bolsa-Analytics
```

Quem já estiver na cópia local deve continuar nela. Não é necessário clonar um projeto para cada área.

## Criar as branches a partir do mesmo commit

Com a base comum registrada, cada integrante deve buscar os commits e conferir o commit informado. Nos exemplos PowerShell abaixo, substitua o texto entre aspas pelo SHA completo compartilhado pela equipe:

```powershell
git fetch origin
$BaseCommit = "COLE_AQUI_O_SHA_BASE_COMUM"
git show --no-patch --oneline $BaseCommit
```

Cada pessoa executa **somente o comando correspondente à sua branch**, na mesma sessão em que definiu `$BaseCommit`:

Pedro:

```powershell
git switch -c feature/backend $BaseCommit
```

Natan:

```powershell
git switch -c feature/ui $BaseCommit
```

Williane:

```powershell
git switch -c feature/charts $BaseCommit
```

Não substituam `$BaseCommit` por um `main` atualizado individualmente: a referência explícita garante que as três branches partam da mesma versão inicial. Se uma branch já existir, usem `git switch` com seu nome, sem `-c`, e confiram sua origem com a equipe antes de continuar.

## Trabalhar e criar commits

Antes de editar, confirme a branch e o estado dos arquivos:

```powershell
git branch --show-current
git status
```

Façam alterações pequenas, dentro de suas responsabilidades, e validem a aplicação afetada conforme o README. Revisem as diferenças antes de preparar o commit:

```powershell
git diff
```

Adicionem somente os arquivos pertinentes. Por exemplo, Pedro pode preparar alterações do backend com:

```powershell
git add backend
git diff --cached
git commit -m "feat: organiza processamento de dados no backend"
```

Esse é apenas um exemplo de mensagem para uma alteração futura; o texto de cada commit deve descrever o que realmente mudou. Natan e Williane devem selecionar os arquivos de suas alterações da mesma forma. Usem mensagens claras, como `feat: ...`, `fix: ...` e `docs: ...`, e evitem misturar mudanças sem relação no mesmo commit.

Não incluam `.env`, ambientes Python, `node_modules`, builds ou arquivos sensíveis. Dependências devem ser combinadas com a equipe e os arquivos de lock devem acompanhar as mudanças correspondentes no manifesto.

## Publicar a própria branch

Depois de revisar e validar os commits, cada integrante pode publicar sua branch manualmente:

Pedro:

```powershell
git push -u origin feature/backend
```

Natan:

```powershell
git push -u origin feature/ui
```

Williane:

```powershell
git push -u origin feature/charts
```

Depois de configurar o upstream com `-u`, use `git push` para enviar novos commits da mesma branch. Não publiquem alterações diretamente na `main`.

## Abrir e integrar um Pull Request

1. Abra o repositório no GitHub e crie um Pull Request da sua `feature/...` para `main`.
2. Explique o problema resolvido, os arquivos ou áreas afetados e como a alteração foi validada.
3. Informe mudanças em dependências, contratos da API, props ou arquivos compartilhados.
4. Peça revisão de outro integrante e resolva os comentários e conflitos.
5. Integre o Pull Request pelo GitHub somente depois da revisão e das verificações combinadas.

A `main` deve continuar executável após cada integração. Os próximos Pull Requests devem considerar as alterações já integradas.

## Sincronizar com a `main`

Conclua ou guarde suas alterações antes de trocar de branch. Com a árvore de trabalho limpa, atualize a `main` local usando avanço direto e depois integre a `origin/main` à sua branch. Exemplo para Pedro:

```powershell
git status
git fetch origin
git switch main
git pull --ff-only origin main
git switch feature/backend
git merge origin/main
```

Natan e Williane devem substituir `feature/backend` por `feature/ui` e `feature/charts`, respectivamente.

`git pull --ff-only` evita criar um merge inesperado na `main` local. Se falhar por divergência, interrompa a sincronização e investigue com a equipe antes de alterar o histórico. `git merge origin/main` incorpora os commits já integrados ao trabalho da feature e pode gerar um commit de merge ou conflitos; ele deve ser executado conscientemente pelo integrante.

Quando houver conflitos, examine cada arquivo, combine a solução com quem alterou a mesma área, remova os marcadores de conflito e valide o resultado. Prepare os arquivos resolvidos com `git add` e finalize o merge com `git commit`. Para cancelar um merge ainda em andamento, use `git merge --abort`. Depois de validar, publique sua branch com `git push`.

## Evitar conflitos

- Avisem antes de editar arquivos compartilhados, especialmente `App.tsx`, páginas, tipos, estilos globais, configurações e dependências.
- Combinem contratos JSON e props antes de desenvolver cada lado da integração.
- Atualizem as branches regularmente e antes de finalizar um Pull Request.
- Evitem reformatação ampla de arquivos fora do escopo da alteração.
- Mantenham Pull Requests pequenos e revisáveis.
- Não usem push forçado nem reescrevam o histórico compartilhado sem acordo explícito da equipe.
- Atualizem a documentação quando mudarem comandos, dependências ou contratos.

A divisão das áreas de trabalho está em [RESPONSABILIDADES.md](RESPONSABILIDADES.md).
