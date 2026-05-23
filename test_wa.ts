import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function test() {
  const { sendOnboardingInviteAlert } = await import('./apps/web/src/app/actions/whatsapp');
  console.log("Testing WhatsApp Invite...");
  const res = await sendOnboardingInviteAlert(
    '58ec1704-1d0e-4e0b-ab08-0e201a4d2e6f', 
    '+15556625396', 
    'test@gmail.com', 
    'Test Salon 1779347103608'
  );
  console.log("Result:", res);
}

test();
