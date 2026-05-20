const API_URL = 'http://localhost:4000/api/v1';

async function seedUI() {
  console.log("🌱 Seeding 'Crown & Comb' into database so the UI works perfectly...");

  try {
    // 1. Create Crown & Comb Salon
    const salonRes = await fetch(\`\${API_URL}/salons\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: "Crown Comb",
        email: "hello@crowncomb.lk",
        phone: "+94771234567",
        address: "123 Independence Ave, Colombo 07",
        currency: "LKR"
      })
    });
    
    // The slug is generated as 'crown-comb' by our NestJS backend logic.
    const salon = await salonRes.json();
    const salonId = salon.id;
    console.log("✅ Salon Created:", salonId);

    // 2. Create Services
    await fetch(\`\${API_URL}/salons/\${salonId}/services\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: "Premium Fade", price: 2000, duration_minutes: 45, category: "Hair", is_active: true })
    });
    await fetch(\`\${API_URL}/salons/\${salonId}/services\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: "Classic Haircut", price: 1500, duration_minutes: 30, category: "Hair", is_active: true })
    });
    await fetch(\`\${API_URL}/salons/\${salonId}/services\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: "Beard Trim & Shape", price: 1000, duration_minutes: 20, category: "Beard", is_active: true })
    });
    console.log("✅ Services Added");

    // 3. Create Staff
    await fetch(\`\${API_URL}/salons/\${salonId}/staff\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: "Nuwan Abeywickrama", role: "Senior Barber", phone: "+94770000001", working_hours: { "mon": ["09:00-17:00"] } })
    });
    await fetch(\`\${API_URL}/salons/\${salonId}/staff\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: "Chamara Perera", role: "Stylist", phone: "+94770000002", working_hours: { "mon": ["09:00-17:00"] } })
    });
    console.log("✅ Staff Added");

    console.log("🎉 Seeding Complete! You can now open http://localhost:3000/salons/crown-comb");

  } catch (error) {
    console.error("❌ Seeding FAILED:", error.message);
  }
}

seedUI();
