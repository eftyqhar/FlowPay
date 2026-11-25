import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.resolve(__dirname, '..', 'supabase', 'migrations');

async function runMigrations() {
  try {
    process.loadEnvFile?.();
  } catch {
    // Rely on process.env if .env is absent
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      'Missing DATABASE_URL environment variable. Set DATABASE_URL in .env or your shell environment before running migrations.'
    );
  }

  const isLocalDb =
    databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');

  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: isLocalDb ? false : { rejectUnauthorized: true },
  });

  try {
    console.log('Connecting to PostgreSQL...');
    await client.connect();

    // Non-destructive migration history tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    if (!fs.existsSync(migrationsDir)) {
      console.log('No supabase/migrations directory found. Skipping.');
      return;
    }

    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    const { rows: appliedRows } = await client.query(
      'SELECT filename FROM public.schema_migrations'
    );
    const appliedSet = new Set(appliedRows.map((r) => r.filename));

    for (const file of migrationFiles) {
      if (appliedSet.has(file)) {
        console.log(`Skipping already applied migration: ${file}`);
        continue;
      }

      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      console.log(`Applying migration: ${file}...`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO public.schema_migrations (filename) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        console.log(`Applied migration: ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Migration failed in ${file}: ${err.message}`, { cause: err });
      }
    }

    console.log('All pending migrations applied successfully.');
  } finally {
    await client.end();
  }
}

runMigrations().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
