import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/config/supabase-admin';
import { requirePlatformAdminFromCookies } from '@/lib/server-admin-auth';
// Dummy services library based on category
const DEFAULT_SERVICES: Record<string, any[]> = {
  "Barber Salon": [
    { name: "Classic Men's Haircut", category: "Haircut", price: 1500, duration_min: 30, description: "Professional gentlemen's haircut." },
    { name: "Beard Trim & Shape", category: "Grooming", price: 800, duration_min: 15, description: "Detailed beard sculpting." },
    { name: "Hot Towel Shave", category: "Grooming", price: 1200, duration_min: 30, description: "Traditional hot towel clean shave." }
  ],
  "Beauty Parlours": [
    { name: "Classic Facial", category: "Facial", price: 3500, duration_min: 60, description: "Deep cleansing facial." },
    { name: "Manicure & Pedicure", category: "Nails", price: 2500, duration_min: 45, description: "Complete hand and foot care." },
    { name: "Eyebrow Threading", category: "Threading", price: 500, duration_min: 15, description: "Precision eyebrow shaping." }
  ],
  "Spa & Wellness": [
    { name: "Swedish Massage", category: "Massage", price: 5000, duration_min: 60, description: "Relaxing full body massage." },
    { name: "Deep Tissue Massage", category: "Massage", price: 6500, duration_min: 60, description: "Targeted deep muscle relief." },
    { name: "Aromatherapy", category: "Wellness", price: 4000, duration_min: 45, description: "Calming essential oils treatment." }
  ],
  "Nail Studio": [
    { name: "Gel Polish", category: "Nails", price: 2500, duration_min: 45, description: "Long-lasting gel application." },
    { name: "Acrylic Extensions", category: "Nails", price: 4500, duration_min: 90, description: "Full set acrylic nails." }
  ]
};

// Generic fallback services
const FALLBACK_SERVICES = [
  { name: "Standard Consultation", category: "Consultation", price: 1000, duration_min: 30, description: "Initial assessment and consultation." },
  { name: "Signature Treatment", category: "Treatment", price: 2500, duration_min: 60, description: "Our premium signature service." }
];

export async function POST(request: Request) {
  try {
    const adminAuth = await requirePlatformAdminFromCookies();
    if ("error" in adminAuth) {
      return NextResponse.json({ error: adminAuth.error }, { status: 401 });
    }

    const { salonId, category, actorEmail } = await request.json();

    if (!salonId) {
      return NextResponse.json({ error: 'Salon ID is required' }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseAdminClient();

    // 0. Fetch Free Subscription Plan limits
    const { data: freePlan } = await supabaseAdmin
      .from('subscription_plans')
      .select('id, max_services, max_staff')
      .eq('name', 'Free')
      .limit(1)
      .single();
      
    const freePlanId = freePlan?.id || 'f0000000-0000-0000-0000-000000000001';
    const maxServices = freePlan?.max_services || 6;
    const maxStaff = freePlan?.max_staff || 2;

    // Standardize Working Hours
    const defaultWorkingHours = Array.from({ length: 7 }, (_, i) => ({
      open: { day: i, time: "0900" },
      close: { day: i, time: "1800" }
    }));

    // 1. Update Salon Status, Subscription Plan, and Working Hours
    const { error: updateError } = await supabaseAdmin
      .from('salons')
      .update({
        onboarding_status: 'AUTO_PROVISIONED',
        booking_enabled: false,
        public_visibility: 'preview',
        is_verified: false,
        subscription_plan_id: freePlanId,
        working_hours: defaultWorkingHours,
        amenities: {
          chairs: 2,
          waiting_capacity: 4,
          ac: true,
          wifi: true,
          parking: false,
          parking_capacity: 0,
          refreshment: false
        }
      })
      .eq('id', salonId);

    if (updateError) throw updateError;

    // 2. Fetch Global Services based on Category
    let mappedServices: any[] = [];
    
    if (category) {
      const { data: categoryData } = await supabaseAdmin
        .from('categories')
        .select('id')
        .eq('name', category)
        .limit(1)
        .single();
        
      if (categoryData?.id) {
        const { data: globalServices } = await supabaseAdmin
          .from('global_services')
          .select('*')
          .eq('category_id', categoryData.id)
          .eq('is_active', true)
          .limit(maxServices);
          
        if (globalServices && globalServices.length > 0) {
          mappedServices = globalServices.map((gs: any) => ({
            salon_id: salonId,
            name: gs.name,
            category: category, 
            price: gs.suggested_price || 1500,
            duration_min: gs.suggested_duration_minutes || 30,
            description: gs.description || "Premium salon service.",
            status: 'active'
          }));
        }
      }
    }

    if (mappedServices.length === 0) {
      const fallbackServicesToCreate = DEFAULT_SERVICES[category || ""] || FALLBACK_SERVICES;
      mappedServices = fallbackServicesToCreate.slice(0, maxServices).map(s => ({
        salon_id: salonId,
        name: s.name,
        category: s.category,
        price: s.price,
        duration_min: s.duration_min,
        description: s.description,
        status: 'active'
      }));
    }

    if (mappedServices.length > 0) {
      const { error: servicesError } = await supabaseAdmin.from('services').insert(mappedServices);
      if (servicesError) throw servicesError;
    }

    // 3. Provision Dummy Staff matching maxStaff limits and salon working hours
    const { data: globalRoles } = await supabaseAdmin
      .from('global_staff_roles')
      .select('role_name')
      .eq('category', 'Operational');

    const fallbackRoles = [
      { role_name: "Senior Stylist" },
      { role_name: "Master Barber" },
      { role_name: "Junior Stylist" }
    ];

    const rolesList = (globalRoles && globalRoles.length > 0) ? globalRoles : fallbackRoles;
    
    // Pick roles dynamically, repeat if we need more than available
    const dummyStaff = Array.from({ length: maxStaff }).map((_, idx) => {
      const selectedRole = rolesList[idx % rolesList.length].role_name;
      // Derive a mock name for dummy staff based on role
      const dummyName = `${selectedRole} Staff ${idx + 1}`;
      
      return {
        salon_id: salonId,
        name: dummyName,
        role: selectedRole,
        commission_rate: 0,
        status: "active",
        working_hours: defaultWorkingHours
      };
    });

    if (dummyStaff.length > 0) {
      const { error: staffError } = await supabaseAdmin.from('salon_staff').insert(dummyStaff);
      if (staffError) throw staffError;
    }

    // 4. Log Activity
    await supabaseAdmin.from('onboarding_logs').insert({
      salon_id: salonId,
      actor_email: actorEmail || "system@trimma.io",
      action: 'AUTO_PROVISIONED',
      notes: `System automatically generated ${mappedServices.length} dummy services and 2 staff profiles.`
    });

    return NextResponse.json({ success: true, message: 'Salon successfully auto-provisioned' });
  } catch (error: any) {
    console.error("Auto-provisioning failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
