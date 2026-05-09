import path from 'path';
import { env } from '../config/env';
// import dotenv from 'dotenv';
// dotenv.config()
// Load env FIRST before any other imports
// dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

async function main() {
  console.log('Connecting to:', env.DATABASE_URL!); // debug line

  const pool = new Pool({
    connectionString: env.DATABASE_URL!
  });

  const db = drizzle(pool);

  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './src/db/migrations' });
  console.log('Migrations complete!');

  await pool.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});