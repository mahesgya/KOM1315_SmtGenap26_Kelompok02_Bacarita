# Copilot Instructions for Bacarita NestJS Backend

## Project Overview
- **Framework:** [NestJS](https://nestjs.com/) (TypeScript)
- **Purpose:** Starter kit with preconfigured TypeORM, Pino logger, centralized HTTP response, custom ExceptionFilter, and Interceptor.
- **Key Directories:**
  - `src/` — Main source code
    - `config/` — Environment and database config (see `database/typeorm.config.ts`)
    - `core/` — Core utilities (HTTP response, logger, filters, interceptors)
    - `main.ts` — App entrypoint
  - `logs/` — Log output (daily rotation)
  - `test/` — E2E and test config

## Architecture & Patterns
- **Centralized Response:** All HTTP responses should use the `HTTPResponse` class (`src/core/http/http-response.ts`) for consistency.
- **Error Handling:** Use the custom `HttpExceptionFilter` (`src/core/http/filters/http-exception.filter.ts`) for error responses.
- **Success Handling:** Use the `SuccessResponseInterceptor` (`src/core/http/interceptors/success-response.interceptor.ts`) for successful responses.
- **Logging:** Uses Pino logger, configured in `src/core/logger/pino-logger.factory.ts`. Logs to both console and files (see `logs/`).
- **Environment Config:** Environment variables validated in `src/config/environment.validation.ts`. Supports `.env.production`, `.env.development`, `.env.test`.
- **Database:** TypeORM config in `src/config/database/typeorm.config.ts`. Migrations via `npm run migration:*` scripts.

## Developer Workflows
- **Install:** `npm install`
- **Run (dev):** `npm run start:dev`
- **Run (prod):** `npm run start:prod`
- **Tests:**
  - Unit: `npm run test` or `npm run test:verbose`
  - E2E: `npm run test:e2e`
  - Coverage: `npm run test:cov`
- **Migrations:** Use `npm run migration:*` scripts for TypeORM migrations.
- **Logs:** Check `logs/` for application logs (auto-created, daily rotation).

## Conventions & Tips
- **Response Consistency:** Always return responses using the `HTTPResponse` utility.
- **Error/Success:** Use the provided filter/interceptor for all controllers.
- **Environment:** Copy `.env.example` to `.env.*` for each environment.
- **Customization:** The kit is fully customizable—add modules as needed, but keep core patterns for consistency.

## Examples
- See `src/core/http/http-response.ts` for response structure.
- See `src/core/http/filters/http-exception.filter.ts` for error handling.
- See `src/core/http/interceptors/success-response.interceptor.ts` for success handling.
- See `src/config/database/typeorm.config.ts` for DB config.

---

For questions or unclear conventions, check the README or ask for clarification.
