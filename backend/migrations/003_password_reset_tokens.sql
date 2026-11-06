DO $migration$
DECLARE
  user_id_type text;
BEGIN
  SELECT format_type(attribute.atttypid, attribute.atttypmod)
  INTO user_id_type
  FROM pg_attribute AS attribute
  JOIN pg_class AS relation ON relation.oid = attribute.attrelid
  JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
  WHERE namespace.nspname = 'public'
    AND relation.relname = 'users'
    AND attribute.attname = 'id'
    AND attribute.attnum > 0
    AND NOT attribute.attisdropped;

  IF user_id_type IS NULL THEN
    RAISE EXCEPTION 'Could not determine public.users.id type';
  END IF;

  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
       user_id %s PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
       token_hash TEXT NOT NULL UNIQUE,
       expires_at TIMESTAMPTZ NOT NULL,
       created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
     )',
    user_id_type
  );
END;
$migration$;

CREATE INDEX IF NOT EXISTS password_reset_tokens_expires_at_idx
  ON public.password_reset_tokens(expires_at);
