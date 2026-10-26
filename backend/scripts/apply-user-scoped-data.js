require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function ensureOwnerColumns() {
  await pool.query(`
    ALTER TABLE public.moves
      ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES public.users(id) ON DELETE CASCADE;

    ALTER TABLE public.trips
      ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES public.users(id) ON DELETE CASCADE;

    ALTER TABLE public.notifications
      ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES public.users(id) ON DELETE CASCADE;

    CREATE INDEX IF NOT EXISTS moves_owner_user_id_idx ON public.moves(owner_user_id);
    CREATE INDEX IF NOT EXISTS trips_owner_user_id_idx ON public.trips(owner_user_id);
    CREATE INDEX IF NOT EXISTS notifications_owner_user_id_idx ON public.notifications(owner_user_id);
  `);

  console.log('owner_user_id columns ensured');
}

ensureOwnerColumns()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => pool.end());
