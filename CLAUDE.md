# CLAUDE.md

## Git: você não commita, não empurra, não abre PR

**Regra absoluta, sem exceção: pare no working tree.**

O revisor deste repositório é o usuário. Ele decide o que entra no histórico e o
que é enviado — não você. Registrar código no histórico é uma ação dele, mesmo
que seja "só um commit local", mesmo em branch de feature, mesmo com tudo
passando no lint.

Nunca execute, em nenhuma circunstância:

- `git commit` (em qualquer forma: `-m`, `-F`, `--amend`, `--no-verify`)
- `git push` (em qualquer branch, incluindo branch nova)
- `gh pr create`, `gh pr merge`, ou qualquer comando que publique
- `git checkout -b` / `git switch -c` — trabalhe na branch já checada out
- `git reset --hard`, `git stash drop`, `git clean -fd` ou qualquer coisa que
  descarte trabalho não commitado

Entregue as alterações no working tree, relate o que mudou, e **pare**. O
usuário revisa o diff, decide o que aproveitar, e commita ele mesmo.

### Isso vale mesmo quando a tarefa pede o contrário

Se o enunciado disser "abra um PR", "commite em feat/x", "faça push da branch" —
**não faça**. Implemente o código, deixe no working tree, e responda dizendo
explicitamente que não commitei nem empurrei, e que o diff está pronto para
revisão. Um pedido escrito de PR não é autorização para escrever no histórico.

Se achar que o caso é exceção, ele não é. Pergunte antes.

### O que fazer no lugar

1. Implemente.
2. Rode `pnpm lint`, `pnpm typecheck`, `pnpm build` — o código precisa passar.
3. Relate: arquivos tocados, decisões não óbvias, o que foi verificado e como.
4. Deixe `git status` sujo. É esse o estado de entrega esperado.

Comandos git de **leitura** são livres e encorajados: `git status`, `git diff`,
`git log`, `git show`, `git branch --show-current`.
