import { sendOnboardingInviteAlert } from './apps/web/src/app/actions/whatsapp.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function test() {
  console.log("Testing WhatsApp Invite...");
  // Use the exact parameters from the user's screenshot
  const res = await sendOnboardingInviteAlert(
    '58ec1704-1d0e-4e0b-ab08-0e201a4d2e6f', 
    '+94711130179', 
    'test@gmail.com', 
    'Test Salon 1779347103608'
  );
  console.log("Result:", res);
}

test();
