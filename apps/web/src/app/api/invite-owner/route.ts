import { NextResponse } from 'next/server';
import { supabase } from '@/config/supabase';

export async function POST(request: Request) {
  try {
    const { salonId, ownerEmail, actorEmail } = await request.json();

    if (!salonId || !ownerEmail) {
      return NextResponse.json({ error: 'Salon ID and Owner Email are required' }, { status: 400 });
    }

    // 1. Update Salon Status to OWNER_INVITED
    const { error: updateError } = await supabase
      .from('salons')
      .update({
        onboarding_status: 'OWNER_INVITED',
        owner_invited_at: new Date().toISOString()
      })
      .eq('id', salonId);

    if (updateError) throw updateError;

    // 2. MOCK: Send WhatsApp & Email
    // In a real scenario, this is where Twilio/SendGrid integration would happen.
    console.log(`[MOCK] Sending WhatsApp to ${ownerEmail}...`);
    console.log(`[MOCK] Sending Email to ${ownerEmail} with magic link...`);

    // 3. Log Activity
    await supabase.from('onboarding_logs').insert({
      salon_id: salonId,
      actor_email: actorEmail || "system@trimma.io",
      action: 'OWNER_INVITED',
      notes: `Automated invitations sent to ${ownerEmail} via WhatsApp and Email.`
    });

    return NextResponse.json({ success: true, message: 'Owner successfully invited.' });
  } catch (error: any) {
    console.error("Owner invitation failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
