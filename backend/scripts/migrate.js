require('dotenv').config();

const fs = require('fs');
const path = require('path');
const pool = require('../db/db');

const migrationsDirectory = path.join(__dirname, '..', 'migrations');

const migrationFiles = [
  '001_user_scoped_data.sql',
  '002_move_trip_completion.sql',
];

async function runMigrations() {
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.schema_migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    for (const filename of migrationFiles) {
      const result = await client.query(
        'SELECT 1 FROM public.schema_migrations WHERE filename = $1',
        [filename]
      );

      if (result.rowCount > 0) {
        console.log(`Skipping already applied migration: ${filename}`);
        continue;
      }

      const filePath = path.join(migrationsDirectory, filename);

      if (!fs.existsSync(filePath)) {
        throw new Error(`Migration file not found: ${filePath}`);
      }

      const sql = fs.readFileSync(filePath, 'utf8');

      console.log(`Running migration: ${filename}`);

      await client.query('BEGIN');

      try {
        await client.query(sql);

        await client.query(
          'INSERT INTO public.schema_migrations (filename) VALUES ($1)',
          [filename]
        );

        await client.query('COMMIT');

        console.log(`Successfully applied: ${filename}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }

    console.log('Database migrations completed successfully.');
  } finally {
    client.release();
  }
}

runMigrations()
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
