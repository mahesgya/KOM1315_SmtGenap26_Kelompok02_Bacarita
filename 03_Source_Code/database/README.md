This directory is a compatibility entrypoint for the course-required
`03_Source_Code/database/` structure.

The actual runtime implementation remains in the backend project:

- `../backend/src/config/database/` for TypeORM configuration
- `../backend/src/database/` for seeders and database bootstrap logic
- `../backend/src/migrations/` for schema migration history

Files in this directory re-export the real source code so the repository shape
matches the expected submission structure without duplicating logic.
