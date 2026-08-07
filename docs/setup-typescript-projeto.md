# Setup Inicial de Projeto TypeScript — Runbook

> Guia reutilizável pra montar a "jaula de qualidade" num projeto TS do zero.
> A lógica central: **a máquina força a qualidade, não o prompt nem a disciplina.** Velocidade da IA + travas que você desenhou.
> Cobre **NestJS** (backend) e **Next.js** — os pontos onde divergem estão marcados com 🔶 **Next**.

---

## TL;DR — ordem de execução

| #   | Peça                 | Arquivos                                                                    | Trava que adiciona                        |
| --- | -------------------- | --------------------------------------------------------------------------- | ----------------------------------------- |
| 1   | Init do projeto      | —                                                                           | —                                         |
| 2   | Docker Compose + env | `docker-compose.yml`, `docker-compose.override.yml`, `.env`, `.env.example` | infra reproduzível, sem credencial no git |
| 3   | tsconfig rigoroso    | `tsconfig.json`                                                             | compilador recusa código frouxo           |
| 4   | ESLint               | `eslint.config.mjs`                                                         | lint type-aware + limites físicos         |
| 5   | Prettier + editor    | `.prettierrc`, `.vscode/settings.json`, `.vscode/extensions.json`           | formatação única, feedback no editor      |
| 6   | Husky + lint-staged  | `.husky/pre-commit`, `.husky/pre-push`, `package.json`                      | commit/push sujo barrado localmente       |
| 7   | CI                   | `.github/workflows/ci.yml`, `.nvmrc`                                        | PR validado em ambiente limpo             |
| 8   | Branch protection    | (config no GitHub)                                                          | merge de código vermelho bloqueado        |

As 4 camadas resultantes: **editor → pre-commit → pre-push → CI+branch protection**. As 3 primeiras são locais; a última não depende de você.

---

## 1. Init do projeto

```bash
# NestJS
nest new nome-do-projeto

# 🔶 Next.js
pnpm create next-app@latest nome-do-projeto
# (o create-next-app já pergunta sobre TypeScript, ESLint, Tailwind, App Router)
```

> Gerenciador: este guia usa **pnpm**. Em qualquer comando, troque por `npm`/`yarn` se preferir.

---

## 2. Docker Compose + variáveis de ambiente

Só relevante se o projeto tem banco/serviços (backend, ou Next com Postgres próprio).

### `docker-compose.yml` (base — é a verdade que vai pro servidor)

```yaml
services:
  db:
    image: postgres:17-alpine
    container_name: app-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:?Defina POSTGRES_USER no .env}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?Defina POSTGRES_PASSWORD no .env}
      POSTGRES_DB: ${POSTGRES_DB:-app}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}']
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

### `docker-compose.override.yml` (só dev local — carregado e mesclado automático)

```yaml
services:
  db:
    ports:
      - '127.0.0.1:5432:5432'
```

### `.env` (gitignored) e `.env.example` (versionado, sem valores)

```
# .env
POSTGRES_USER=app
POSTGRES_PASSWORD=troque-esta-senha
POSTGRES_DB=app
```

### Decisões e porquês

- **Sem `version:` no topo** — o Compose v2 aposentou esse campo.
- **`postgres:17-alpine`** — fixa o major (correções de segurança automáticas, sem pulo de versão surpresa); `alpine` é a imagem menor.
- **`restart: unless-stopped`** — religa no boot do PC, mas respeita um `stop` deliberado (diferente de `always`, que ressuscita mesmo após stop manual).
- **`:?` na credencial = fail-closed.** Sem a var, o `compose up` aborta. Nunca dê _default_ a senha/usuário: um default faz o sistema degradar silenciosamente pra uma credencial fraca se o `.env` sumir (fail-open). Nome do banco pode ter default (`:-app`) — não é segredo.
- **Regra da linha divisória:** "faz parte da autenticação?" → usuário e senha = sim, `:?` nos dois. Endurecer o usuário **e** projetar assumindo que o atacante já o conhece (username é baixa entropia, vaza por mil canais).
- **`$$` no healthcheck** — um `$` o Compose expande ao ler o arquivo; `$$` vira `$` literal e quem expande é o shell _dentro_ do container, lendo o ambiente real do container. Garante que o check siga a config, não um valor cravado.
- **`ports` = exposição pro host, não comunicação app↔banco.** App e banco se falam pela rede interna do Docker por nome de serviço (`db:5432`), sem `ports`. Em prod o banco **não publica porta nenhuma**; só o app é exposto. Daí a separação base (sem porta) / override (porta só local, em `127.0.0.1` = só loopback).
- **Volume nomeado** (`pgdata`) sobrevive a `docker compose down`. Reset total: `docker compose down -v`.
- **`.env.example` versionado** documenta _quais_ vars existem sem expor valores. Quem clonar copia pra `.env` e preenche.

### Sobre secrets (Docker)

Em `docker compose` puro, "secret" é só um **arquivo montado** em `/run/secrets/` — **sem criptografia em repouso** (isso só no Swarm). Fecha vetores de env var (`docker inspect`, herança por subprocessos, log de crash), mas pro sandbox o ganho real é pequeno. `.env` com `:?` já é "bom e correto". Vale aprender o padrão `_FILE` (Postgres, n8n, redis suportam) pra quando for produção de verdade.

**Camadas do `_FILE`:** montar o arquivo em `/run/secrets/` funciona pra **qualquer imagem** (é do Docker). Mas o app _ler_ esse arquivo depende da imagem implementar a convenção `_FILE`. Se a imagem não suporta nem `_FILE` nem config-por-arquivo: ou usa env var mesmo, ou embrulha um entrypoint (`export VAR="$(cat /run/secrets/x)"`).

### Comandos úteis

```bash
docker compose up -d                              # sobe (base + override mesclados)
docker compose -f docker-compose.yml up -d        # só base (sem porta) — uso no servidor
docker compose ps                                 # status + health
docker compose exec db psql -U app -d app         # psql dentro do container
docker compose down -v                            # reset total (apaga volume)
```

---

## 3. `tsconfig.json` rigoroso

O scaffold (Nest ou Next) entrega o TS **afrouxado** — ele _desliga_ regras fortes em vez de ligar. O trabalho é virar a chave.

### O que ligar (substituir/adicionar em `compilerOptions`)

```jsonc
{
  "compilerOptions": {
    // ... opções de módulo/saída que o scaffold já põe ...

    // STRICT de verdade — uma flag liga a família inteira
    "strict": true,
    "noFallthroughCasesInSwitch": true,

    // Além do strict (rigor extra)
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,

    "skipLibCheck": true,
  },
}
```

### O que REMOVER do scaffold

- `"noImplicitAny": false` → **apaga.** Um `false` explícito vence o que o `strict: true` implica. Se deixar, o strict fica meio desligado e você não percebe.
- `"strictBindCallApply": false` → **apaga** (mesmo motivo).
- `"strictNullChecks": true` → redundante com `strict`, pode remover.
- `"baseUrl"` → **apaga** se você não usa `paths`. Desde o **TS 6.0** ele é deprecado (some no TS 7.0, o compilador nativo em Go). Não silencie com `ignoreDeprecations` — remova a causa.

### O que cada flag liga

`strict: true` = `noImplicitAny` + `strictNullChecks` + `strictFunctionTypes` + `strictBindCallApply` + `strictPropertyInitialization` + `noImplicitThis` + `useUnknownInCatchVariables` + `alwaysStrict`.

### Atritos esperados ao ligar (não são bugs — é o compilador trabalhando)

- **`strictPropertyInitialization`** reclama de propriedades de classe sem inicializador (DTOs, entidades). Resolve com definite assignment: `titulo!: string` ("runtime preenche isso"). Não atrapalha DI no construtor.
- **`useUnknownInCatchVariables`** faz `catch (e)` virar `e: unknown` → estreite antes de usar (`if (e instanceof Error)`).
- **`noUncheckedIndexedAccess`** faz `arr[0]` e `obj[chave]` virarem `T | undefined` → mais guardas. É o mais "picante". Se algum trecho virar estorvo, trate o `undefined` ali em vez de desligar a flag global.
- **`noUnusedParameters`** pega callbacks de framework (guard/interceptor/middleware) com parâmetro exigido pela assinatura mas não usado → prefixe com `_`: `(_req, res)`.

### 🔶 Path aliases (`@/`)

- TS `paths` é **só compile-time**. Runtime não conhece `@/` → `Cannot find module` no build.
- **Nest:** precisa de **4 lugares concordando**: tsconfig `paths` (sem baseUrl, prefixo explícito `"@/*": ["./src/*"]`), `tsc-alias` no build (`nest build && tsc-alias`), dev (Nest CLI resolve em CJS; cuidado com ESM), e Jest (`moduleNameMapper`). É fácil dar dor de cabeça — se não quiser, **use imports relativos**.
- **🔶 Next:** muito mais simples — o bundler (Turbopack/webpack) resolve `paths` nativamente. `"@/*": ["./*"]` ou `["./src/*"]` no tsconfig **já funciona** em dev, build e testes, sem `tsc-alias`. Aqui o alias vale a pena.

### 🔶 Módulos

- **Nest:** `module: nodenext` em projeto CommonJS (sem `"type": "module"` no package.json). Confirme que **não** tem `type: module`, senão o `nodenext` exige extensão `.js` em todo import relativo.
- **🔶 Next:** o tsconfig é gerenciado pelo próprio Next (`"module": "esnext"`, `"jsx": "preserve"`, `"plugins": [{ "name": "next" }]`). Não mexa nessas; adicione só as flags de rigor da seção acima.

---

## 4. ESLint — `eslint.config.mjs` (flat config)

O scaffold liga o `recommended` e ainda _afrouxa_ regras (rebaixa de error pra warn, desliga `no-explicit-any`). Suba pro nível forte.

### Para NestJS

```javascript
// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['eslint.config.mjs', 'dist', 'coverage'] },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked, // <- irmão do strict:true (era recommendedTypeChecked)
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  // guardrails físicos — só em src, pra não brigar com testes
  {
    files: ['src/**/*.ts'],
    rules: {
      'max-lines': [
        'error',
        { max: 200, skipBlankLines: true, skipComments: true },
      ],
      'max-lines-per-function': [
        'error',
        { max: 50, skipBlankLines: true, skipComments: true },
      ],
      complexity: ['error', { max: 10 }],
      'max-depth': ['error', 4],
    },
  },
  // testes: afrouxa o que atrapalha mock/asserção
  {
    files: ['**/*.spec.ts', 'test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },
  { rules: { 'prettier/prettier': 'error' } },
);
```

### Decisões

- **`strictTypeChecked`** > `recommendedTypeChecked`. Acende muito mais (família `no-unsafe-*`), mas o ponto é: ela dispara onde você toca dado sem tipo (`req.body`, JSON parseado) — sinal de "tipe a fronteira aqui", não de desligar.
- **Guardrails escopados em `src/**`** — `max-lines-per-function`brigaria com os`describe`/`it` longos dos testes.
- **Override de teste** — mock/asserção precisam de `any`/cast; rigor cirúrgico ali atrapalha. Rigor onde corre risco (produção), folga onde não corre (teste).
- **`prettier/prettier` sem opção inline** — a opção mora no `.prettierrc` (fonte única). `eslint-plugin-prettier` desliga as regras de estilo do ESLint e deixa formatação 100% com o Prettier (acaba a briga entre os dois).
- **Opcionais:** `max-params` (cutuca construtor com muita DI — meio que é o ponto); `no-cycle` via `eslint-plugin-import-x` (pega dependência circular, que em Nest causa DI `undefined`).

### 🔶 Para Next.js

Next traz config própria (`eslint-config-next`, hoje em flat config). O caminho é **estender** a do Next e adicionar o rigor:

```javascript
// eslint.config.mjs (Next)
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import tseslint from 'typescript-eslint';

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

export default tseslint.config(
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  ...tseslint.configs.strictTypeChecked, // adiciona o rigor type-aware
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'max-lines': [
        'error',
        { max: 250, skipBlankLines: true, skipComments: true },
      ],
      complexity: ['error', { max: 12 }],
    },
  },
);
```

> 🔶 Em componentes React, `max-lines-per-function` é hostil (JSX infla a contagem) — prefira `max-lines` por arquivo e seja mais generoso nos limites.

### Regra mental pra quando uma regra acende

> **A regra está certa e meu código está errado, ou a regra não entende meu contexto?**
>
> - Var sem uso, `Promise` solta → regra certa, **conserta o código**.
> - Classe vazia de `*.module.ts` no Nest (`no-extraneous-class`) → regra sem contexto, **abre exceção escopada** (`files: ['**/*.module.ts']`).
> - Nunca desligue a regra **global** por um caso específico.
> - Quando a regra oferece `void` como saída (ex.: `no-floating-promises`), desconfie — é o "ignore", raramente o que você quer. **Tratar > silenciar.**

---

## 5. Prettier + editor (fonte única)

### `.prettierrc` (a verdade do estilo, lida pelo editor E pelo ESLint)

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "endOfLine": "auto"
}
```

### `.vscode/settings.json` (versionado — vence as preferências pessoais de cada dev)

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": { "source.fixAll.eslint": "explicit" },
  "[typescript]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
  "[typescriptreact]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
  "[json]": { "editor.defaultFormatter": "esbenp.prettier-vscode" }
}
```

### `.vscode/extensions.json`

```json
{
  "recommendations": ["esbenp.prettier-vscode", "dbaeumer.vscode-eslint"]
}
```

### Porquês

- **Prettier = aparência** (formatação, nenhuma decisão muda o que o código faz). **ESLint = correção** (pega problema e qualidade). "Está torto" vs "está errado".
- **Três camadas:** (1) extensão do VS Code = conveniência local, opcional, não confiável; (2) Prettier do projeto = fonte de verdade compartilhada; (3) lint-staged/CI = a trava que não depende de editor.
- Hierarquia do VS Code: _Default < User < Workspace_. O `.vscode/settings.json` no repo **vence** a config pessoal — por isso ele alinha todo mundo.
- `source.fixAll.eslint` auto-conserta no save — **depende da extensão `dbaeumer.vscode-eslint`** estar instalada (ela traz o feedback do ESLint pra dentro do editor, em vez de só no terminal/commit).
- Commit **só** `settings.json` e `extensions.json` do `.vscode/` (não a pasta inteira).

---

## 6. Husky + lint-staged

```bash
pnpm add -D husky lint-staged
pnpm exec husky init      # cria .husky/, adiciona "prepare": "husky" no package.json
```

### `package.json`

```jsonc
{
  "scripts": {
    "lint": "eslint \"{src,test}/**/*.ts\" --max-warnings 0",
    "typecheck": "tsc --noEmit",
  },
  "lint-staged": {
    "*.ts": ["eslint --max-warnings 0 --fix"],
    "*.{json,yml,yaml,md}": ["prettier --write"],
  },
}
```

> 🔶 Next: ajuste o glob do lint pra `"{src,app,components}/**/*.{ts,tsx}"` e o lint-staged pra `"*.{ts,tsx}"`.

### `.husky/pre-commit`

```
pnpm exec lint-staged
```

### `.husky/pre-push`

```
pnpm run typecheck && pnpm test
```

### Decisões

- **Divisão de carga:** pre-commit roda só o leve (`lint-staged`, nos arquivos staged — rápido); pre-push roda o pesado (typecheck do projeto todo + testes — menos frequente).
- **Por que typecheck/test não vão no pre-commit:** `tsc` precisa do projeto inteiro, não dá pra rodar "só nos staged", e seria lento a cada commit.
- **Nos `.ts`, só `eslint --fix`** (não prettier também) — com `eslint-plugin-prettier`, o prettier já roda dentro do eslint; rodar de novo é redundante. O segundo glob cobre arquivos que o eslint não toca.
- **`prepare: husky`** instala os hooks após qualquer `pnpm install` — tira o "funciona na minha máquina". Versione.
- Husky v9: hook é o comando puro (sem shebang). `HUSKY=0` desliga global (não vire hábito — é furar a própria jaula).
- O CI continua sendo o muro real; o hook é só pra não empurrar coisa quebrada.

---

## 7. CI — GitHub Actions

### `.nvmrc` (fonte única da versão do Node)

```
24
```

### `package.json` — fixa o pnpm

```jsonc
"packageManager": "pnpm@9.15.0"
```

### `.github/workflows/ci.yml`

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4 # ANTES do setup-node (gotcha do cache)
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm run lint
      - run: pnpm run typecheck
      - run: pnpm run build
      - run: pnpm test
```

### Decisões

- **`pnpm/action-setup` ANTES de `setup-node`** — o `cache: pnpm` roda `pnpm store path`, então o pnpm tem que já existir. Inverter quebra.
- **`--frozen-lockfile`** = o `npm ci` do pnpm: instala exato do lockfile e **falha** se estiver dessincronizado. Reproduzível.
- **Steps separados** (`lint`/`typecheck`/`build`/`test`) — quando quebra, o GitHub mostra _qual_ portão caiu.
- **`build` além do `typecheck`** — typecheck só confere tipos; o build faz a compilação real que vira o `dist` (pega config de CLI quebrada, metadata de decorator etc.).
- **`node-version-file: '.nvmrc'`** — versão do Node numa fonte só (máquina via `nvm use`, CI, deploy).
- **Aviso "Node 24 by default"** no log é o runtime _interno_ das actions, separado do seu `node-version`. Não é erro.
- 🔶 **Banco em testes (Fase 2):** quando os testes baterem no Postgres, adicione um bloco `services: postgres:` ao job, com as mesmas env vars.

---

## 8. Branch protection (o muro de verdade)

⚠️ **O workflow sozinho NÃO impede merge** — só roda e reporta. O que bloqueia é a branch protection.
⚠️ **Em repo PRIVADO no plano Free, branch protection NÃO é aplicada** — só vale em repo público ou conta Team/Enterprise.

### Passo a passo (GitHub → Settings → Branches)

1. **Add rule** / **Add ruleset** (o GitHub empurra "Rulesets"; "classic rule" serve igual).
2. **Branch name pattern:** `main` (esse campo é a _branch a proteger_, não o nome da regra — se digitar outra coisa dá "Applies to 0 branches").
3. Ligue:
   - ☑️ **Require a pull request before merging** — bloqueia push direto na main.
   - ☑️ **Require status checks to pass** → busque e selecione **`quality`** (só aparece depois do CI ter rodado ao menos uma vez).
   - ☑️ **Require branches to be up to date before merging** — força a branch a estar atualizada com a main antes de fundir (pega _conflito semântico_ — ver abaixo). **Solo:** ligue sem dó. **Time movimentado:** avalie, pode virar fila chata; a solução madura é **merge queue**.
   - ☑️ **Block force pushes** (já vem por padrão).
4. **Bypass list: VAZIA.** Lista vazia = nem o dono atravessa. Muro que o dono pula é sugestão.

### Conflito de merge vs conflito semântico

- **Merge (textual):** mesma linha editada por dois → o git pega sozinho (`<<<<<<<`).
- **Semântico (lógico):** ninguém toca a mesma linha, mas o código quebra junto (ex.: você chama `f()`, colega renomeia `f` → `g` e funde antes). Git não vê conflito; CT passou isolado. O "require up to date" força o CI a rodar no **estado combinado** e pega isso.

### Validar o muro

```bash
git checkout main
echo "test" >> README.md && git add -A && git commit -m "test: furar a main"
git push origin main          # deve ser RECUSADO: "Changes must be made through a pull request"
git reset --hard HEAD~1       # desfaz o teste
```

### Fluxo de trabalho resultante

```
git checkout -b feat/x   →   commit (pre-commit checa)   →   push (pre-push checa)
   →   abre PR   →   CI roda   →   merge só com 'quality' verde
```

---

## `.gitignore` — itens que este setup exige

```
node_modules
dist
coverage
.env
# secrets/        # se usar docker secrets via arquivo
```

---

## Princípios que guiaram tudo (a mentalidade, não os comandos)

1. **A máquina força, o prompt não pede.** Guardrail é trava física, não convenção.
2. **Fail-closed, não fail-open.** Faltou config crítica? Recusa subir. Nunca degrade silencioso pra um estado fraco.
3. **Fonte única de verdade.** Versão do Node (`.nvmrc`), do pnpm (`packageManager`), estilo (`.prettierrc`), config de lint — cada coisa num lugar só, lida por todos os consumidores. Duplicata = divergência futura.
4. **Rigor onde corre risco, folga onde não corre.** Produção estrita, teste afrouxado. Calibragem > aplicar a regra mais dura em tudo.
5. **Quando uma trava acende:** a regra está certa e o código errado, ou a regra não entende o contexto? Conserta o código OU abre exceção escopada — nunca desliga global.
6. **Tratar > silenciar.** `void`, `ignoreDeprecations`, default de senha — todos são "calar o mensageiro". Resolva a causa.
7. **Defesa em camadas.** Editor (conveniência) → pre-commit → pre-push → CI+branch protection. As últimas não dependem da sua disciplina.
8. **Saber quando NÃO complicar também é sênior.** Secret sofisticado num sandbox solo é cargo cult. Conheça o degrau de cima sem subir nele sem necessidade.
