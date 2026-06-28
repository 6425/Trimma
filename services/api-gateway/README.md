# Trimma API Gateway (NestJS)

**Not deployed to production.** The live Trimma product uses Next.js route handlers under `apps/web/src/app/api/*`.

## Security defaults

- All routes return **503** unless `TRIMMA_API_GATEWAY_ENABLED=true`.
- When enabled, every route requires a valid Supabase **Bearer** token (`SupabaseAuthGuard`).
- CORS defaults to `http://localhost:3000` (override with `TRIMMA_API_GATEWAY_CORS_ORIGIN`).

## Local development only

```bash
export TRIMMA_API_GATEWAY_ENABLED=true
export SUPABASE_URL=...
export SUPABASE_SERVICE_ROLE_KEY=...
npm run start:dev --workspace=@trimma/api-gateway
```

The gateway was removed from `vercel.json` so it is not exposed on beta/live Vercel deployments.
