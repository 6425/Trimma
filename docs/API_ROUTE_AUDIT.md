# Trimma API Route Security Audit

Last updated: 2026-06-26

Middleware does **not** protect `/api/*`. Every route must enforce its own auth.

Shared helpers: `apps/web/src/lib/server-request-auth.ts`

| Helper | Roles allowed |
|--------|----------------|
| `getRequestSession` | Any signed-in user |
| `requireRequestRoles` | Custom role list |
| `requireAgentFromRequest` | agent, regional_head, admin |
| `requireStaffFromRequest` | admin, regional_head, agent, salon_owner |
| `requirePlatformAdminFromRequest` | admin |
| `requirePlatformAdminFromCookies` | admin (cookie-based) |
| `requireAgentFromCookies` | agent, regional_head, admin |
| `requireCustomerFromCookies` | customer, salon_owner (blocks admin/agent/regional_head) |

## Route inventory (31)

### Admin — platform admin required

| Route | Methods | Auth |
|-------|---------|------|
| `/api/admin/provision-user` | POST | Bearer token + platform admin |
| `/api/admin/update-password` | POST | `requirePlatformAdminFromCookies` |
| `/api/admin/salons/[id]` | PATCH | `requirePlatformAdminFromCookies` |
| `/api/discover-leads` | POST | `requirePlatformAdminFromCookies` |
| `/api/provision-salon` | POST | `requirePlatformAdminFromCookies` |

### Agent — agent / regional head / admin

| Route | Methods | Auth |
|-------|---------|------|
| `/api/agent/leads` | POST | `requireAgentFromRequest` — assignee from session (admin may pass `agentEmail`) |
| `/api/invite-owner` | POST | `requireAgentFromCookies` + salon access check |

### Staff — salon owner, agent, regional head, or admin

| Route | Methods | Auth |
|-------|---------|------|
| `/api/commissions` | GET | `requireStaffFromRequest` + booking ownership check |
| `/api/email/send` | POST | `requireStaffFromRequest` |

### Customer

| Route | Methods | Auth |
|-------|---------|------|
| `/api/customer/profile` | GET, PATCH | `requireCustomerFromCookies` |

### Auth (session setup)

| Route | Methods | Auth |
|-------|---------|------|
| `/api/auth/session` | POST | Valid Supabase access token |
| `/api/auth/logout` | POST | Public (clears session) |
| `/api/auth/link-owner` | POST | Valid access token |
| `/api/auth/request-password-reset` | POST | Public + IP rate limit (Upstash when configured) |

### Checkout — public with validation

| Route | Methods | Auth |
|-------|---------|------|
| `/api/checkout/booking` | POST | Public + IP rate limit + card validation |
| `/api/checkout/subscription` | POST | Public + validation |
| `/api/checkout/stripe/booking-session` | POST | Public + IP rate limit |
| `/api/checkout/stripe/subscription-session` | POST | `requireSalonOwnerFromCookies` |
| `/api/checkout/stripe/complete` | POST | Stripe payment intent verification |
| `/api/checkout/stripe/update-pending` | POST | HMAC `pendingToken` + IP rate limit; subscription also requires salon owner |
| `/api/checkout/resend-whatsapp` | POST | Public + IP rate limit + booking must exist |

### Public forms — intentionally open

| Route | Methods | Notes |
|-------|---------|-------|
| `/api/public/salon-requests` | POST | Input validation only |
| `/api/public/agent-requests` | POST | Input validation only |
| `/api/public/help-documents` | GET | Published docs only |
| `/api/onboarding/lead` | POST | Partner onboarding form |
| `/api/salons/search` | GET | Public marketplace search |

### Integrations

| Route | Methods | Auth |
|-------|---------|------|
| `/api/telegram/webhook` | POST | Telegram secret header |
| `/api/telegram/connect` | GET, POST | `requireRequestRoles` — salon_owner only |

### Health

| Route | Methods | Auth |
|-------|---------|------|
| `/api/health` | GET | Public |

### Disabled

| Route | Methods | Auth |
|-------|---------|------|
| `/api/clean-leads` | GET | Returns 404 |
| `/api/seed-agents` | GET | Returns 404 |

## Recent fixes (2026-06-28)

1. **Server-side checkout price validation** — booking, promotion, and subscription amounts are recomputed from Supabase before PaymentIntent creation and checkout completion (`checkout-price-validation.ts`).
2. **Middleware RBAC** — uses signed `trimma-session` HMAC cookie only; agent/regional-head routes enforce role; login flows call `/api/auth/session` to mint the signed cookie.
3. **API Gateway** — removed from Vercel deploy; Nest gateway disabled by default (`TRIMMA_API_GATEWAY_ENABLED`) and requires Supabase Bearer auth when enabled.

## Recent fixes (2026-06-27)

1. **Distributed rate limits** — checkout, email, and password-reset limits use Upstash Redis when `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` are set; in-memory fallback for local dev.
2. **`/api/auth/request-password-reset`** — IP rate limit added (5 / 15 min).

## Recent fixes (2026-06-26)

1. **`/api/checkout/stripe/update-pending`** — requires HMAC `pendingToken` issued at session creation; whitelists payload keys by checkout type; subscription updates also require salon owner session.
2. **`/api/checkout/stripe/subscription-session`** — requires salon owner session (was public).
3. **`/api/checkout/stripe/booking-session`** — IP rate limit added.
4. **`/api/telegram/connect`** — restricted to salon_owner role.
5. **`/api/customer/profile`** — blocks admin, agent, and regional_head roles.
6. **Dev scripts** — removed hardcoded Supabase service-role JWT fallbacks from `apps/web/test_db.js` and `db-*.cjs`.

## Recent fixes (2026-06-11)

1. **`/api/agent/leads`** — was open with service role; now requires agent/regional head/admin session. `assign_to` is taken from the signed-in agent (not the request body).
2. **`/api/commissions`** — was open; now requires staff session + booking access verification.
3. **`/api/email/send`** — `actorEmail` in body could bypass auth; now requires staff session.
4. **`/api/checkout/resend-whatsapp`** — added rate limit + booking existence check.
5. **`/api/provision-salon`** — removed anon-key fallback for service role client.

## Adding new API routes

1. Choose the narrowest `require*` helper from `server-request-auth.ts`.
2. Never use `SUPABASE_SERVICE_ROLE_KEY || ANON_KEY` fallback.
3. Document the route in this file.
4. Public routes must have input validation and rate limiting where abuse is possible.
