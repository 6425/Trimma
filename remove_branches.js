const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'apps/web/.env') });

async function run() {
  const sql = `ALTER TABLE public.subscription_plans DROP COLUMN IF EXISTS max_branches;`;
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to DB. Running migration...');
    await client.query(sql);
    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Error running migration:', err);
  } finally {
    await client.end();
  }
}

run();
