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
    'ALTER TABLE public.moves ADD COLUMN IF NOT EXISTS owner_user_id %s REFERENCES public.users(id) ON DELETE CASCADE',
    user_id_type
  );
  EXECUTE format(
    'ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS owner_user_id %s REFERENCES public.users(id) ON DELETE CASCADE',
    user_id_type
  );
  EXECUTE format(
    'ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS owner_user_id %s REFERENCES public.users(id) ON DELETE CASCADE',
    user_id_type
  );
END;
$migration$;

CREATE INDEX IF NOT EXISTS moves_owner_user_id_idx ON public.moves(owner_user_id);
CREATE INDEX IF NOT EXISTS trips_owner_user_id_idx ON public.trips(owner_user_id);
CREATE INDEX IF NOT EXISTS notifications_owner_user_id_idx ON public.notifications(owner_user_id);

-- Existing rows intentionally remain unowned. Assign them explicitly only after
-- deciding which account should receive the previously shared data.
