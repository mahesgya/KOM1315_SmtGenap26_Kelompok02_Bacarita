This directory is a compatibility entrypoint for the course-required `src/auth/`
structure.

The actual NestJS auth implementation remains in `src/feature/auth/` to avoid a
risky large-scale refactor in the middle of development.

Use this directory when you need to reference the authentication, authorization,
or digital-signature modules from documentation or future imports. Each file
here re-exports the real implementation from `src/feature/auth/`.
