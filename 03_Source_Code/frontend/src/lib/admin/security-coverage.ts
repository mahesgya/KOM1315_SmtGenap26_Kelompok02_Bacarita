export interface SecurityCoverageSection {
  id: "authentication" | "authorization" | "accounting";
  title: string;
  shortLabel: string;
  status: string;
  summary: string;
  controls: string[];
  evidence: string[];
}

export const SECURITY_COVERAGE_SECTIONS: SecurityCoverageSection[] = [
  {
    id: "authentication",
    title: "Authentication",
    shortLabel: "AuthN",
    status: "Documented",
    summary:
      "Credential validation, JWT verification, token revocation checks, and temporary lockout are implemented and covered by unit/e2e tests.",
    controls: [
      "Admin login accepts email or username, rejects malformed or incomplete credentials, and clears token on logout.",
      "AuthGuard rejects missing bearer headers, malformed tokens, expired or invalid JWTs, and revoked sessions.",
      "Failed attempts are counted and can trigger a temporary account lock after repeated credential failures.",
    ],
    evidence: [
      "backend/src/feature/auth/guards/auth.guard.spec.ts",
      "backend/test/e2e/users/admin-auth.e2e-spec.ts",
      "backend/src/feature/auth/auth.service.ts",
    ],
  },
  {
    id: "authorization",
    title: "Authorization",
    shortLabel: "AuthZ",
    status: "Enforced",
    summary:
      "Role-based access control is enforced server-side, and admin-only access to the audit dashboard is explicitly protected.",
    controls: [
      "The authoritative audit endpoint is guarded with AuthGuard and restricted to AuthRole.ADMIN.",
      "Cross-role access attempts are rejected with 403 when the authenticated role does not satisfy the route requirement.",
      "Logged-out or revoked sessions cannot continue to access guarded routes because token hash validation is checked against stored state.",
    ],
    evidence: [
      "backend/src/feature/auth/auth.controller.ts",
      "backend/src/feature/auth/guards/auth.guard.spec.ts",
      "backend/src/feature/auth/auth.service.ts",
    ],
  },
  {
    id: "accounting",
    title: "Accounting / Audit Trail",
    shortLabel: "Audit",
    status: "Operational",
    summary:
      "Authentication events are recorded in persistent audit storage and exposed in this dashboard with filters, trend summaries, and event tables.",
    controls: [
      "Login success, login failure, lockout, and logout events are persisted with user, role, IP address, user agent, and timestamp metadata.",
      "This admin page reads live audit data from the backend instead of mock fixtures.",
      "Recent alerts, per-window trends, and paginated event history provide reviewable evidence for security activity.",
    ],
    evidence: [
      "backend/src/feature/auth/entities/auth-audit-log.entity.ts",
      "backend/src/feature/auth/auth.service.ts",
      "frontend/src/services/admin.services.tsx",
    ],
  },
];

export const SECURITY_COVERAGE_META = {
  aaaLabel: "Authentication, Authorization, and Accounting",
  unitTestCount: 9,
  adminE2eCoverageAreas: 12,
  auditedEvents: ["LOGIN_OK", "LOGIN_FAIL", "LOCKED", "LOGOUT"],
};
