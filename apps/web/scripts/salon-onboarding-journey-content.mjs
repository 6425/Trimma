/** Content for Trimma Salon Onboarding Journey — A to Z + Go-Live Readiness (English). */

export const DOC_META = {
  title: "Trimma Salon Onboarding Journey",
  subtitle: "End-to-End Process, Notifications & Go-Live Readiness (A to Z)",
  version: "June 2026",
  audience: "Product, Operations, Field Agents, Salon Partners, Admin",
  footer: "Trimma — Sri Lanka Beauty & Wellness Booking Platform · trimma.lk",
  fileName: "Trimma-Salon-Onboarding-Journey-A-to-Z.docx",
};

export const STATUS_PIPELINE = {
  headers: ["Status", "Meaning", "Who sets it"],
  rows: [
    ["DISCOVERED", "Imported from Google Places or CSV; not yet assigned", "Admin discovery / import"],
    ["AUTO_PROVISIONED", "Admin ran draft storefront provisioning", "Admin"],
    ["ASSIGNED_TO_AGENT", "Routed to a field agent for verification", "Admin / system"],
    ["AGENT_VERIFIED", "Agent saved field editor data", "Agent (auto on draft save)"],
    ["OWNER_INVITED", "Owner invite sent (email + WhatsApp)", "Agent or self-serve signup"],
    ["OWNER_ACTIVATED", "Owner submitted profile for booking approval", "Salon owner"],
    ["PENDING_ADMIN_VERIFICATION", "Agent enabled booking; awaiting admin verify", "Agent"],
    ["VERIFIED", "Admin granted Trimma verification; fully live", "Platform admin"],
    ["REJECTED", "Pipeline rejection (agent or admin)", "Agent / admin"],
    ["AGENT_APPROVED (legacy)", "Old status — treat as pending admin verification", "Legacy data only"],
  ],
};

export const SECTIONS = [
  {
    id: "overview",
    title: "1. Executive summary",
    paragraphs: [
      "Salon onboarding moves a business from discovery (Google Places, web lead, or self-serve signup) through agent verification, owner profile completion, booking enablement, and final admin verification before the salon is fully live on Trimma.",
      "There are three main paths: (A) Agent-led — admin discovers or receives a lead, agent completes the field editor, invites the owner, owner fills the dashboard, agent enables booking; (B) Owner self-serve — owner signs in with Google at /onboarding and claims a salon; (C) Web waiting-list — partner applies via form into salon_leads until an agent converts them.",
      "Customer bookings require booking_enabled plus valid salon phone and owner email. The Trimma Verified badge and 50% deposit collection require additional business and bank documentation plus admin is_verified.",
    ],
  },
  {
    id: "entry-paths",
    title: "2. Entry paths (how salons enter Trimma)",
    table: {
      headers: ["Path", "Entry point", "Database", "Initial status"],
      rows: [
        ["Owner self-serve", "/onboarding → Google sign-in", "salons (new row)", "OWNER_INVITED"],
        ["Web waiting-list", "/onboarding partner form", "salon_leads", "ASSIGNED_TO_AGENT / NEW"],
        ["Admin Google discovery", "Admin → Leads → Discover", "salons upsert", "DISCOVERED"],
        ["Admin CSV import", "Admin bulk import", "salons", "DISCOVERED"],
        ["Admin provision storefront", "Provision draft catalog", "salons", "AUTO_PROVISIONED"],
        ["Agent manual lead", "Agent field editor → new salon", "salons", "ASSIGNED_TO_AGENT"],
        ["Agent converts web lead", "Convert salon_leads row", "salons (new)", "ASSIGNED_TO_AGENT"],
        ["Admin assigns to agent", "Assign agent on lead", "salons", "ASSIGNED_TO_AGENT"],
      ],
    },
    bullets: [
      "Self-serve salons use source_type: self_serve_onboarding and start at OWNER_INVITED without agent field work.",
      "Web form leads stay in salon_leads until an agent manually converts them — they are not live salons yet.",
      "Google-discovered salons use placeholder owner emails (draft-*@trimma.io) until the agent invites a real owner.",
    ],
  },
  {
    id: "agent-path",
    title: "3. Agent-led journey (A to Z)",
    table: {
      headers: ["Step", "Agent action", "Status change", "Notifications"],
      rows: [
        ["1", "Receive assigned salon/lead", "ASSIGNED_TO_AGENT", "Email + WhatsApp to agent"],
        ["2", "Complete field editor (services, staff, amenities, owner Gmail, WhatsApp)", "→ AGENT_VERIFIED", "—"],
        ["3", "Send to Salon Owner for Review", "→ OWNER_INVITED", "Onboarding email + WhatsApp invite"],
        ["4", "Owner signs in and completes dashboard", "→ OWNER_ACTIVATED", "In-app ack to owner; agent notified"],
        ["5", "Enable Booking & Send to Admin", "→ PENDING_ADMIN_VERIFICATION, booking_enabled: true", "Owner + admin WhatsApp; agent approval emails"],
        ["6a", "Admin verifies salon", "→ VERIFIED, is_verified: true", "Verified badge email + WhatsApp to owner"],
        ["6b", "Agent rejects owner submission", "→ OWNER_INVITED or ASSIGNED_TO_AGENT", "Rejection email + WhatsApp to owner"],
        ["6c", "Admin rejects", "→ REJECTED", "In-app rejection notification"],
      ],
    },
    bullets: [
      "Primary UI: /agent/leads (field editor, status actions).",
      "Owner invite requires real owner Gmail and WhatsApp number on the lead.",
      "Enable Booking sets booking_enabled: true before admin verification — customers may book if phone and email are valid.",
    ],
  },
  {
    id: "self-serve-path",
    title: "4. Owner self-serve journey (A to Z)",
    bullets: [
      "1. Owner visits /onboarding and signs in with Google (OnboardingOwnerSignup).",
      "2. System provisions a salon row (provision-self-serve-salon) at OWNER_INVITED with booking_enabled: false.",
      "3. Owner opens /dashboard/profile and completes Operations tab: name, address, map pin, hero image, phone, categories.",
      "4. Owner adds staff (/dashboard/staff), services (/dashboard/services), maps staff to services.",
      "5. Owner completes Business Info and Bank tabs (for verification badge and deposits).",
      "6. Owner clicks Submit for Booking Approval → OWNER_ACTIVATED.",
      "7. Assigned agent (by district) reviews and enables booking OR rejects for corrections.",
      "8. Admin verifies → VERIFIED + Trimma badge.",
    ],
    paragraphs: [
      "Self-serve skips agent field editor steps 1–2 but still requires agent approval to enable booking and admin verification for the badge.",
    ],
  },
  {
    id: "owner-dashboard",
    title: "5. Owner dashboard — what must be completed",
    subsections: [
      {
        title: "5.1 Profile completion score (owner-facing)",
        table: {
          headers: ["Step", "Weight", "Required for submit?", "What to complete"],
          rows: [
            ["Booking essentials", "35%", "Yes", "Name, address, map pin, hero image, phone or real email"],
            ["Business information", "25%", "No (for submit)", "Legal name, business type, owner NIC, extended business info"],
            ["Bank & documents", "25%", "No (for submit)", "Bank details + NIC / registration uploads"],
            ["Trimma verification badge", "15%", "Admin only", "Granted by platform admin after review"],
          ],
        },
      },
      {
        title: "5.2 Operational setup (not in approval gate but required to take bookings)",
        table: {
          headers: ["Step", "Location", "Required for live bookings?"],
          rows: [
            ["Add staff", "/dashboard/staff", "Yes — at least one active staff member"],
            ["Add services", "/dashboard/services", "Yes — import or custom services"],
            ["Map staff to services", "/dashboard/staff", "Yes — each service needs staff coverage"],
            ["Activate services", "/dashboard/services", "Yes — set status Active after mapping"],
            ["Working hours", "/dashboard/profile", "Recommended"],
            ["Amenities", "/dashboard/profile", "Optional"],
            ["Telegram connect", "/dashboard/profile", "Optional backup alerts"],
          ],
        },
        bullets: [
          "Owner can submit for approval before staff/services are complete — bookings will fail or show empty until setup is done.",
          "Salon setup progress banner tracks: staff → services → map → publish (4 steps).",
        ],
      },
    ],
  },
  {
    id: "admin-path",
    title: "6. Admin workflow",
    table: {
      headers: ["Action", "Effect", "Difference from Verify"],
      rows: [
        ["Discover (Google Places)", "Creates DISCOVERED salons with place data", "—"],
        ["Provision storefront", "Seeds draft services/staff from category", "—"],
        ["Assign agent", "ASSIGNED_TO_AGENT + agent notification", "—"],
        ["Approve (directory)", "status: active — platform access only", "Does NOT verify or enable badge"],
        ["Verify", "VERIFIED, is_verified: true, booking_enabled: true, activation_status: ACTIVE", "Full go-live + badge"],
        ["Reject", "REJECTED, status: rejected", "—"],
      ],
    },
    bullets: [
      "Pending verification queue: PENDING_ADMIN_VERIFICATION or legacy AGENT_APPROVED with is_verified: false.",
      "Admin can verify even if business/bank incomplete (warning dialog) — badge unlocks deposit rules separately.",
      "Primary UIs: /admin/leads, /admin/salons, /admin dashboard queue.",
    ],
  },
  {
    id: "notifications",
    title: "7. Notifications by onboarding stage",
    table: {
      headers: ["Stage", "Email", "WhatsApp", "In-app / other"],
      rows: [
        ["Web lead submitted", "partner-lead-received to applicant", "—", "—"],
        ["Lead assigned to agent", "agent-lead-assigned", "Agent WhatsApp alert", "—"],
        ["Owner invited", "onboarding invite", "Onboarding invite (Meta/text)", "—"],
        ["Owner submitted (OWNER_ACTIVATED)", "—", "—", "Owner submission ack"],
        ["Agent enabled booking", "Agent approval to owner", "Owner + admin alert phone", "AGENT_APPROVED notification"],
        ["Admin verified", "Admin approval to owner", "Verified badge WhatsApp", "SALON_VERIFIED notification"],
        ["Agent rejects profile", "Rejection email", "Rejection WhatsApp", "SALON_REJECTED"],
        ["First customer booking (post-live)", "Booking created owner email", "appointment_confirmation_1 to owner", "Owner notification bell"],
      ],
    },
    bullets: [
      "WhatsApp onboarding and owner alerts require Meta-approved templates outside the 24-hour session window.",
      "No dedicated admin email when salon hits PENDING_ADMIN_VERIFICATION — relies on dashboard + optional admin WhatsApp phone.",
      "Telegram mirrors some WhatsApp events; optional owner Telegram connect on profile.",
    ],
  },
  {
    id: "gates",
    title: "8. What gates going live",
    table: {
      headers: ["Gate", "Condition", "Current behaviour"],
      rows: [
        ["Customer can book online", "booking_enabled + valid phone + valid owner email", "Agent can enable before admin verify"],
        ["Salon page loads publicly", "Known slug", "NOT gated on verification — page loads even if hidden"],
        ["Book button active", "isSalonPubliclyBookable()", "Shows message if booking disabled"],
        ["Marketplace / deals listing", "status verified/active or is_verified", "Partial filter on deals page"],
        ["Trimma Verified badge", "is_verified: true", "Admin only"],
        ["50% reservation deposits", "Business + bank complete + is_verified", "canCollectVerifiedReservationDeposit()"],
      ],
    },
  },
  {
    id: "go-live-gaps",
    title: "9. Go-live readiness — gaps to address",
    subsections: [
      {
        title: "9.1 Critical (address before public launch)",
        table: {
          headers: ["#", "Gap", "Risk", "Recommended action"],
          rows: [
            [
              "C1",
              "Dual lead systems (salon_leads vs salons)",
              "Web leads lost if agent never converts",
              "Auto-convert or unified pipeline; agent SLA on salon_leads queue",
            ],
            [
              "C2",
              "booking_enabled before admin verify",
              "Customers book unverified salons; copy says otherwise",
              "Align policy: either delay booking_enabled until VERIFIED or update all copy",
            ],
            [
              "C3",
              "Owner WhatsApp alerts need Meta template",
              "Owners miss booking notifications",
              "Configure appointment_confirmation_1 in Admin + Supabase patch",
            ],
            [
              "C4",
              "Staff/services not required before OWNER_ACTIVATED",
              "Salons go live with empty catalog",
              "Block submit or agent enable until setup progress 100%",
            ],
            [
              "C5",
              "Public salon page not gated on verification",
              "Unverified salons discoverable by slug",
              "Filter public page fetch on booking_enabled or public_visibility",
            ],
          ],
        },
      },
      {
        title: "9.2 High priority (first month post-launch)",
        table: {
          headers: ["#", "Gap", "Recommended action"],
          rows: [
            ["H1", "Legacy AGENT_APPROVED status in DB", "Migration script to PENDING_ADMIN_VERIFICATION"],
            ["H2", "public_visibility inconsistent (hidden vs false vs preview)", "Normalize to string enum in code + DB"],
            ["H3", "publishAdminLead creates duplicate salons row", "Deprecate or merge with provision flow"],
            ["H4", "Admin Approve vs Verify confusion", "Rename UI labels; single clear go-live action"],
            ["H5", "No admin email on pending verification queue", "Add admin email trigger for PENDING_ADMIN_VERIFICATION"],
            ["H6", "/onboarding dual CTAs (Google vs waiting-list)", "Clearer path separation in UI copy"],
            ["H7", "Self-serve skips agent data quality check", "Agent review step before enable booking"],
          ],
        },
      },
      {
        title: "9.3 Medium / cleanup",
        bullets: [
          "Stale status options in admin LeadTables dropdown (ACTIVE, PROFILE_COMPLETED, etc.).",
          "Owner activation wizard shows for ASSIGNED_TO_AGENT — may confuse invited owners.",
          "handleCompleteOnboarding saves minimal fields — business/bank not enforced at submit.",
          "COMPLETED onboarding_status referenced in filters but never set in main flows.",
          "Hardcoded district agent fallbacks if DB agents missing (salon-onboarding-paths.ts).",
          "onboarding_logs exists but no unified admin timeline UI.",
          "Welcome WhatsApp for new customers still plain text — needs Meta template.",
        ],
      },
    ],
  },
  {
    id: "checklist",
    title: "10. Go-live checklist (operations)",
    table: {
      headers: ["Item", "Owner", "Status in code"],
      rows: [
        ["Meta confirmmessage configured (customer checkout)", "Admin", "Required — working when set"],
        ["Meta appointment_confirmation_1 (owner booking alert)", "Admin", "Required — patch + Admin settings"],
        ["WhatsApp credentials in Vercel + Supabase", "Admin", "Required"],
        ["Agent territory assignments populated", "Admin", "Required for routing"],
        ["salon_leads conversion process documented for agents", "Ops", "Manual today"],
        ["Owner profile + staff + services setup guide", "Ops", "Dashboard banners exist"],
        ["Admin verification queue monitored daily", "Admin", "Dashboard queue exists"],
        ["Booking RLS + checkout patches applied", "DevOps", "Supabase SQL patches"],
        ["Stripe / PayHere production keys", "DevOps", "Checkout"],
        ["Email templates (Resend) configured", "Admin", "Admin → Email settings"],
        ["Status enum migration (AGENT_APPROVED)", "Dev", "Not done"],
        ["Public page gating policy decided", "Product", "Not enforced in code"],
      ],
    },
  },
  {
    id: "timeline",
    title: "11. Typical timeline (agent-led salon)",
    bullets: [
      "Day 0 — Admin discovers salon or receives web lead; assigns agent.",
      "Day 1–3 — Agent visits salon, completes field editor, sends owner invite.",
      "Day 2–5 — Owner signs in, completes profile, staff, services.",
      "Day 5 — Owner submits for booking approval (OWNER_ACTIVATED).",
      "Day 5–7 — Agent reviews, enables booking (PENDING_ADMIN_VERIFICATION).",
      "Day 7 — Admin verifies salon (VERIFIED); badge + full deposit rules active.",
      "Day 7+ — Customers can book; owner receives appointment_confirmation_1 on each booking.",
    ],
  },
  {
    id: "key-urls",
    title: "12. Key URLs & files",
    table: {
      headers: ["Role", "URL / path"],
      rows: [
        ["Owner onboarding", "/onboarding"],
        ["Owner dashboard", "/dashboard/profile, /dashboard/staff, /dashboard/services"],
        ["Agent workspace", "/agent/leads"],
        ["Admin pipeline", "/admin/leads, /admin/salons"],
        ["Progress scoring", "apps/web/src/lib/salon-onboarding-progress.ts"],
        ["Bookability gates", "apps/web/src/lib/salon-bookability.ts"],
        ["Setup steps (staff/services)", "apps/web/src/lib/salon-setup-progress.ts"],
        ["Owner submit action", "apps/web/src/app/actions/salon-operations.ts"],
        ["Agent approve/reject", "apps/web/src/app/actions/agent-leads-update.ts, agent-approval.ts"],
        ["Notifications", "apps/web/src/app/actions/salon-onboarding-notifications.ts"],
      ],
    },
  },
  {
    id: "summary",
    title: "13. Summary",
    paragraphs: [
      "Salon onboarding is a multi-party pipeline: discovery → agent verification → owner invite → owner dashboard completion → agent booking enablement → admin verification. The highest-risk gaps before go-live are dual lead systems, booking enabled before admin verify, missing Meta templates for owner alerts, and staff/services not being required before activation.",
      "Address the Critical items in Section 9.1, run the WhatsApp SQL patches, and align marketing copy with actual booking_enabled behaviour before opening Trimma to the public.",
    ],
  },
];

export const STATUS_PIPELINE_SECTION = {
  title: "Appendix A — Onboarding status reference",
  table: STATUS_PIPELINE,
};
