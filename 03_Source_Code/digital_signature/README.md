This directory is a compatibility entrypoint for the course-required
`03_Source_Code/digital_signature/` structure.

The actual implementation remains in:

- `../backend/src/feature/auth/digital-signature/` for RSA signing and
  verification
- `../backend/src/feature/test-session/` for integration into the main workflow

Files here re-export the live backend implementation so the repository can show
the digital-signature module as a first-class source-code area without moving
working code.
