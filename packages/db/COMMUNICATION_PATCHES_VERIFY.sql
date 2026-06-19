-- ==============================================================================
-- TRIMMA: COMMUNICATION PATCHES — VERIFICATION
-- ==============================================================================
-- Run after applying communication patches (see run order in chat / README).
-- Returns column counts + table checks. "ready" = schema supports admin UI + sends.
-- ==============================================================================

SELECT 'resend' AS channel,
       count(*) FILTER (WHERE column_name IN (
         'resend_api_key', 'resend_from_email', 'resend_from_name'
       )) AS columns_found,
       3 AS columns_expected,
       CASE WHEN count(*) FILTER (WHERE column_name IN (
         'resend_api_key', 'resend_from_email', 'resend_from_name'
       )) = 3 THEN 'ready' ELSE 'run RESEND_CREDENTIALS_PATCH.sql' END AS status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'global_payment_settings'

UNION ALL

SELECT 'email_templates',
       count(*) FILTER (WHERE column_name LIKE 'email_%'),
       50,
       CASE WHEN count(*) FILTER (WHERE column_name LIKE 'email_%') >= 40
            THEN 'ready'
            ELSE 'run EMAIL_TEMPLATES_PATCH.sql then EMAIL_TEMPLATES_V2_PATCH.sql' END
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'global_payment_settings'

UNION ALL

SELECT 'whatsapp',
       count(*) FILTER (WHERE column_name LIKE 'whatsapp_%'),
       25,
       CASE WHEN count(*) FILTER (WHERE column_name LIKE 'whatsapp_%') >= 20
            THEN 'ready'
            ELSE 'run WHATSAPP_TEMPLATES_FULL_PATCH.sql then EMAIL_TEMPLATES_V2_PATCH.sql' END
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'global_payment_settings'

UNION ALL

SELECT 'telegram_settings',
       count(*) FILTER (WHERE column_name LIKE 'telegram_%'),
       30,
       CASE WHEN count(*) FILTER (WHERE column_name LIKE 'telegram_%') >= 25
            THEN 'ready'
            ELSE 'run TELEGRAM_SETTINGS_PATCH.sql' END
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'global_payment_settings'

UNION ALL

SELECT 'telegram_connect',
       CASE WHEN to_regclass('public.telegram_connect_tokens') IS NOT NULL THEN 1 ELSE 0 END,
       1,
       CASE WHEN to_regclass('public.telegram_connect_tokens') IS NOT NULL
            THEN 'ready'
            ELSE 'run TELEGRAM_CONNECT_PATCH.sql' END

UNION ALL

SELECT 'users.telegram_chat_id',
       count(*) FILTER (WHERE column_name = 'telegram_chat_id'),
       1,
       CASE WHEN count(*) FILTER (WHERE column_name = 'telegram_chat_id') = 1
            THEN 'ready'
            ELSE 'run TELEGRAM_CONNECT_PATCH.sql or TELEGRAM_SETTINGS_PATCH.sql' END
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users';
