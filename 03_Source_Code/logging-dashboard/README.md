# Logging Dashboard

Standalone security dashboard for Bacarita admin audit logs.

## Environment

Create `.env.local` in this folder:

```bash
BACARITA_API_URL=http://localhost:5000
AUDIT_DASHBOARD_ACCESS_KEY=change_me_dashboard_key
```

The backend must use the same `AUDIT_DASHBOARD_ACCESS_KEY`.

## Run

```bash
npm run dev
```

Open `http://localhost:3000`.

## Mechanism

- Browser calls the standalone route: `/api/audit-logs`
- Next.js route forwards the request to Bacarita backend
- Backend validates `x-audit-dashboard-key`
- Browser never needs the admin JWT
