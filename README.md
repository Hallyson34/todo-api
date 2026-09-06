# todo-api

API REST para gerenciamento de tarefas organizadas em grupos, com autenticação
e autorização por dono. Cada usuário autenticado cria seus próprios grupos e
tarefas, e só tem acesso aos recursos que lhe pertencem.

## Tecnologias utilizadas

- **[NestJS](https://nestjs.com/)** (v11) — framework principal da API
- **TypeScript**
- **[Prisma](https://www.prisma.io/)** (v7) com adapter `@prisma/adapter-pg` — ORM e migrations
- **PostgreSQL 17** — banco de dados
- **[Better Auth](https://www.better-auth.com/)** (`@thallesp/nestjs-better-auth`) — autenticação por sessão (cookie)
- **class-validator** / **class-transformer** — validação de DTOs
- **[Swagger](https://docs.nestjs.com/openapi/introduction)** (`@nestjs/swagger`) — documentação da API
- **nestjs-pino** — logging estruturado
- **OpenTelemetry** + **Sentry** — observabilidade e monitoramento de erros
- **Jest** + **Supertest** — testes unitários e e2e
- **ESLint** + **Prettier** + **Husky** + **lint-staged** — qualidade e padronização de código
- **Docker Compose** — sobe o Postgres localmente
- **pnpm** — gerenciador de pacotes

## Como rodar o projeto

### Pré-requisitos

- Node.js (versão definida em [.nvmrc](.nvmrc))
- [pnpm](https://pnpm.io/) `11.0.8`
- Docker e Docker Compose (para o banco de dados)

### Passo a passo

1. **Instale as dependências**

   ```bash
   pnpm install
   ```

2. **Configure as variáveis de ambiente**

   Copie o arquivo de exemplo e ajuste os valores conforme necessário:

   ```bash
   cp .env.example .env
   ```

   Gere um valor para `BETTER_AUTH_SECRET`:

   ```bash
   openssl rand -base64 32
   ```

3. **Suba o banco de dados**

   ```bash
   docker compose up -d
   ```

   O Postgres fica disponível em `localhost:5433` (porta definida em
   [compose.override.yaml](compose.override.yaml)).

4. **Rode as migrations do Prisma**

   ```bash
   pnpm prisma migrate deploy
   ```

5. **Inicie a aplicação em modo desenvolvimento**

   ```bash
   pnpm start:dev
   ```

   A API sobe por padrão em `http://localhost:3000`. A documentação Swagger
   fica disponível em `http://localhost:3000/docs`.

### Outros comandos úteis

| Comando           | Descrição                                    |
| ----------------- | -------------------------------------------- |
| `pnpm build`      | Compila o projeto                            |
| `pnpm start:prod` | Roda a build compilada (`dist/main`)         |
| `pnpm lint`       | Executa o ESLint                             |
| `pnpm typecheck`  | Verifica os tipos com `tsc --noEmit`         |
| `pnpm test`       | Executa os testes unitários                  |
| `pnpm test:e2e`   | Executa os testes end-to-end                 |
| `pnpm test:cov`   | Executa os testes com relatório de cobertura |
| `pnpm format`     | Formata o código com Prettier                |
