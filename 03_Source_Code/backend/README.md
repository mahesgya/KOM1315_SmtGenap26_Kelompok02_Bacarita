<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

<p align="center">
  <strong>POWERED BY </strong>
  <a href="https://github.com/AghnatHs/nest-core-kit" target="_blank">
    Nest TypeScript Core Starter Kit by AghnatHs
  </a>
</p>
<p align="center">

# Bacarita Backend

## Project setup

```bash
$ git clone https://github.com/Je-One-One-LIDM/bacarita-be.git

$ cd bacarita-be

$ npm install

# setup .env.production, .env.development, and .env.test from .env.example
$ cp .env.example .env.production
$ cp .env.example .env.development
$ cp .env.example .env.test

$ mkdir logs

$ npm run migration:run

$ npm run db:seed

$ npm run start:dev

```

## Migration (Development)

Migration in development will use .env.development

```bash
# Apply all migration to database
$ npm run migration:run

# generate migration based on current entities (Linux / MacOs)
$ npm run migration:generate --name=CreateUsersTable
# generate migration based on current entities (Windows)
$ npm run migration:generate:win --name=CreateUsersTable

# create empty migration file (Linux / MacOs)
$ npm run migration:create --name=CustomMigration
# create empty migration file (Windows)
$ npm run migration:create:win --name=CustomMigration

# undo most recent migration
$ npm run migration:revert
```

- Never edit existing migration, create a new one instead
- On Windows, use the \*:win variants because environment variable syntax differs (%VAR% - $VAR).

## Migration (Production)

For running a newly migration in production, just run this command

```bash
$ npm run migration:run:prod or npm run migration:run
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# unit tests (verbose)
$ npm run test:verbose

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
