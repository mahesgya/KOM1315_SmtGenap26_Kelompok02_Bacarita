# Bacarita

A full-stack web application built with NestJS (backend) and Next.js (frontend).

## Tech Stack

### Backend
- **Framework**: NestJS 11
- **Database**: MySQL via TypeORM
- **Auth**: JWT + Passport
- **File Upload**: Multer
- **Email**: Nodemailer + NestJS Mailer (EJS templates)
- **AI**: OpenAI SDK
- **Logging**: Pino + pino-pretty
- **Validation**: class-validator, Joi
- **Language**: TypeScript

### Frontend
- **Framework**: Next.js 15 (Turbopack)
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript

## Repository Structure Note

For course compliance, the backend now exposes a `src/auth/` compatibility
entrypoint under `03_Source_Code/backend/src/auth/`. The actual NestJS auth
feature implementation still lives in `03_Source_Code/backend/src/feature/auth/`
so the current codebase remains stable while still matching the expected
repository shape more closely.

To align the repository root structure with the course template, the project
also exposes:

- `03_Source_Code/database/` as a compatibility entrypoint for TypeORM config,
  seeders, and migration-related database code from the backend project.
- `03_Source_Code/digital_signature/` as a compatibility entrypoint for the RSA
  digital-signature module implemented in the backend auth feature.

---

## Prerequisites

- Node.js >= 18
- MySQL database
- npm

---

## Installation

### Backend

```bash
cd 03_Source_Code/backend
npm install
```

### Frontend

```bash
cd 03_Source_Code/frontend
npm install
```

---

## Environment Variables

Create `03_Source_Code/backend/.env.development` for local development.
The backend does not read `backend/.env`; it loads `.env.development`,
`.env.production`, or `.env.test` based on `NODE_ENV`.

```env
NODE_ENV=development

# Database
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=bacarita

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES=1d

# Admin Seeder
ADMIN_EMAIL=admin@bacarita.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=adminbacarita123
ADMIN_FULL_NAME=Admin Bacarita

# Curator Seeder
CURATOR_EMAIL=curator@example.com
CURATOR_USERNAME=curator
CURATOR_PASSWORD=curatorbacarita123
CURATOR_FULL_NAME=Curator Name

# Mail
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your_email@example.com
MAIL_PASS=your_email_password
MAIL_FROM_NAME=Bacarita
MAIL_FROM_EMAIL=your_email@example.com

# OpenRouter
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=model
```

---

## Running the App

### Backend

```bash
cd 03_Source_Code/backend

# Development (watch mode)
npm run start:dev

# Production
npm run start:prod
```

### Frontend

```bash
cd 03_Source_Code/frontend

# Development
npm run dev

# Production build
npm run build
npm run start
```

---

## Database

### Run Migrations

```bash
cd 03_Source_Code/backend
npm run migration:run
npm run db:seed
```

After seeding, admin login uses the `ADMIN_EMAIL` and `ADMIN_PASSWORD`
configured in `03_Source_Code/backend/.env.development`.

### Generate a New Migration

```bash
npm run migration:generate --name=MigrationName
```

### Revert Last Migration

```bash
npm run migration:revert
```

### Seed Database

```bash
npm run db:seed
```

---

## Testing

```bash
cd 03_Source_Code/backend

# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

---

## Available Scripts

### Backend

| Script | Description |
|--------|-------------|
| `npm run start:dev` | Start in development (watch mode) |
| `npm run start:prod` | Run migrations then start production server |
| `npm run build` | Build for production |
| `npm run lint` | Lint and auto-fix |
| `npm run format` | Format with Prettier |

### Frontend

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server (Turbopack) |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Lint code |
