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

Create a `.env` file in `03_Source_Code/backend/`:

```env
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_NAME=bacarita

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d

# Mail
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=your_email@example.com
MAIL_PASS=your_email_password
MAIL_FROM=your_email@example.com

# OpenAI
OPENAI_API_KEY=your_openai_api_key
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
```

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
