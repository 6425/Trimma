-- Roles & Permissions matrix (replaces Regional Admin with Regional Head, adds Customer)
-- Run once in Supabase SQL Editor AFTER AGENT_HIERARCHY_PATCH.sql (if applied).

BEGIN;

-- ── Catalog tables ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.platform_roles (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_system BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.platform_permission_modules (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.platform_permission_actions (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.role_module_permissions (
  role_slug TEXT NOT NULL REFERENCES public.platform_roles(slug) ON DELETE CASCADE,
  module_slug TEXT NOT NULL REFERENCES public.platform_permission_modules(slug) ON DELETE CASCADE,
  action_slug TEXT NOT NULL REFERENCES public.platform_permission_actions(slug) ON DELETE CASCADE,
  allowed BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (role_slug, module_slug, action_slug)
);

CREATE INDEX IF NOT EXISTS idx_role_module_permissions_role
  ON public.role_module_permissions (role_slug);

-- ── Seed roles ───────────────────────────────────────────────────────────────
INSERT INTO public.platform_roles (slug, name, description, color, sort_order, is_system)
VALUES
  ('superadmin', 'Super Admin', 'Full system access. Can modify roles and global platform settings.', 'brand', 10, true),
  ('admin', 'Admin', 'Access to all operational modules. Cannot modify global billing.', '#1A1C29', 20, true),
  ('regional_head', 'Regional Head', 'Territory sales lead with full agent portal access and sub-agent team management.', '#4A154B', 30, true),
  ('agent', 'Agent', 'Field sub-agent assigned to a regional head.', '#FBBF24', 40, true),
  ('salon_owner', 'Salon Owner', 'Business owners managing their salon operations.', 'brand', 50, true),
  ('customer', 'Customer', 'End users booking appointments and managing profiles.', '#0EA5E9', 60, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order;

-- Remove deprecated role slug from catalog (permissions cascade-delete)
DELETE FROM public.platform_roles WHERE slug = 'regional_admin';

-- ── Seed modules ─────────────────────────────────────────────────────────────
INSERT INTO public.platform_permission_modules (slug, name, sort_order)
VALUES
  ('users', 'Users & Identity', 10),
  ('salons', 'Salon Listings', 20),
  ('leads', 'Lead Extraction', 30),
  ('bookings', 'Booking Master', 40),
  ('payments', 'Financials & Commissions', 50),
  ('agents', 'Agent Assignment & Hierarchy', 60),
  ('territories', 'Territory Coverage', 70),
  ('agent_portal', 'Agent Operating System', 80),
  ('customer_portal', 'Customer Experience', 90),
  ('seo', 'SEO Engine', 100),
  ('global', 'System Settings', 110)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order;

-- ── Seed actions ─────────────────────────────────────────────────────────────
INSERT INTO public.platform_permission_actions (slug, name, sort_order)
VALUES
  ('view', 'View', 10),
  ('create', 'Create', 20),
  ('edit', 'Edit', 30),
  ('delete', 'Delete', 40),
  ('approve', 'Approve', 50),
  ('export', 'Export', 60)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order;

-- ── Migrate legacy regional_admin identity ───────────────────────────────────
UPDATE public.users
SET global_role = 'regional_head'
WHERE lower(btrim(global_role)) = 'regional_admin';

UPDATE public.user_roles
SET role = 'regional_head'
WHERE lower(btrim(role)) = 'regional_admin';

UPDATE public.agents
SET agent_tier = 'regional_head',
    reports_to_agent_id = NULL,
    sub_agent_split_percent = NULL
WHERE id IN (
  SELECT a.id
  FROM public.agents a
  JOIN public.users u ON lower(btrim(u.email)) = lower(btrim(a.user_email))
  WHERE lower(btrim(u.global_role)) = 'regional_head'
);

-- ── Default permission matrix (idempotent upsert) ───────────────────────────
-- Helper: upsert one permission cell
CREATE OR REPLACE FUNCTION public.seed_role_permission(
  p_role TEXT,
  p_module TEXT,
  p_action TEXT,
  p_allowed BOOLEAN
) RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.role_module_permissions (role_slug, module_slug, action_slug, allowed)
  VALUES (p_role, p_module, p_action, p_allowed)
  ON CONFLICT (role_slug, module_slug, action_slug)
  DO UPDATE SET allowed = EXCLUDED.allowed, updated_at = now();
END;
$$;

-- Super Admin: full access
SELECT public.seed_role_permission('superadmin', module.slug, action.slug, true)
FROM public.platform_permission_modules module
CROSS JOIN public.platform_permission_actions action;

-- Admin: no delete on core ops
SELECT public.seed_role_permission('admin', module.slug, action.slug,
  CASE WHEN action.slug = 'delete' THEN false ELSE true END)
FROM public.platform_permission_modules module
CROSS JOIN public.platform_permission_actions action;

-- Regional Head: agent ops + team management
SELECT public.seed_role_permission('regional_head', m, a, allowed) FROM (VALUES
  ('salons','view',true), ('salons','create',true), ('salons','edit',true), ('salons','approve',true), ('salons','export',true),
  ('leads','view',true), ('leads','create',true), ('leads','edit',true), ('leads','approve',true), ('leads','export',true),
  ('bookings','view',true),
  ('payments','view',true), ('payments','export',true),
  ('agents','view',true), ('agents','edit',true), ('agents','approve',true), ('agents','export',true),
  ('territories','view',true), ('territories','edit',true),
  ('agent_portal','view',true), ('agent_portal','create',true), ('agent_portal','edit',true), ('agent_portal','approve',true)
) AS t(m,a,allowed);

-- Agent (field sub-agent)
SELECT public.seed_role_permission('agent', m, a, allowed) FROM (VALUES
  ('salons','view',true), ('salons','create',true), ('salons','edit',true),
  ('leads','view',true), ('leads','create',true), ('leads','edit',true),
  ('payments','view',true),
  ('agents','view',true),
  ('territories','view',true),
  ('agent_portal','view',true), ('agent_portal','create',true), ('agent_portal','edit',true)
) AS t(m,a,allowed);

-- Salon Owner
SELECT public.seed_role_permission('salon_owner', m, a, allowed) FROM (VALUES
  ('salons','view',true), ('salons','edit',true),
  ('bookings','view',true), ('bookings','create',true), ('bookings','edit',true),
  ('payments','view',true)
) AS t(m,a,allowed);

-- Customer
SELECT public.seed_role_permission('customer', m, a, allowed) FROM (VALUES
  ('salons','view',true),
  ('bookings','view',true), ('bookings','create',true), ('bookings','edit',true),
  ('payments','view',true),
  ('customer_portal','view',true), ('customer_portal','create',true), ('customer_portal','edit',true)
) AS t(m,a,allowed);

DROP FUNCTION public.seed_role_permission(TEXT, TEXT, TEXT, BOOLEAN);

COMMIT;
