const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'apps/web/.env') });

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to DB. Updating subscription_plans...');
    
    // We update the feature_flags JSONB column for all plans, 
    // replacing the "features" array with exactly the 6 requested features,
    // while keeping other properties like allowed_categories_limit intact.
    
    const query = `
      UPDATE public.subscription_plans
      SET feature_flags = jsonb_set(
        COALESCE(feature_flags, '{}'::jsonb),
        '{features}',
        '["Staff Management", "FB/WA Integration", "Free Gmail Integration", "Free Google Business Page", "Performance Insights", "Salon Dashboard with QR"]'::jsonb
      );
    `;
    
    await client.query(query);
    console.log('Successfully updated features for all subscription plans.');
  } catch (err) {
    console.error('Error updating plans:', err);
  } finally {
    await client.end();
  }
}

run();
