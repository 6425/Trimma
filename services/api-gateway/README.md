# Trimma API Gateway (NestJS)

**Not deployed to production.** All live/beta traffic uses Next.js route handlers under `apps/web/src/app/api/*`.

## Lockdown summary

| Control | Behavior |
|---------|----------|
| Vercel | Removed from root `vercel.json`; `apps/web/vercel.json` builds **web only** (`--filter=@trimma/web...`) |
| Root `npm start` | Starts **web only** (not this gateway) |
| `npm run dev` | Starts **web only** |
| `npm run dev:gateway` | Starts gateway locally with `TRIMMA_API_GATEWAY_ENABLED=true` |
| HTTP when disabled | Every route returns **503** (`GatewayLockdownGuard`) |
| HTTP when enabled | Valid Supabase **Bearer** token required (`SupabaseAuthGuard`) |
| CORS | Only registered when enabled; defaults to `http://localhost:3000` |

## Local development

1. Copy `services/api-gateway/.env.example` → `.env` (or export vars in your shell).
2. Set `TRIMMA_API_GATEWAY_ENABLED=true`.
3. From repo root:

```bash
npm run dev:gateway
```

Or manually:

```bash
export TRIMMA_API_GATEWAY_ENABLED=true
export SUPABASE_URL=...
export SUPABASE_SERVICE_ROLE_KEY=...
npm run start:dev --workspace=@trimma/api-gateway
```

Gateway listens on **port 4000** by default.

## Do not

- Add this service back to Vercel or any public host without a full security review.
- Enable `TRIMMA_API_GATEWAY_ENABLED` on production Trimma web deployments.
- Expose port 4000 on a public firewall.

## Architecture note

This scaffold was an early NestJS experiment. Booking, salon, and auth logic now lives in the Next.js app. Keep this folder for optional local API prototyping only.
