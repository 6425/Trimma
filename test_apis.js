const API_URL = 'http://localhost:4000/api/v1';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  console.log("==================================================");
  console.log("🚀 STARTING TRIMMA END-TO-END API TESTS");
  console.log("==================================================\n");

  let salonId, serviceId, staffId, bookingTime;

  try {
    // 1. Create Salon
    console.log("1️⃣  TESTING: Create Salon (POST /salons)");
    const salonRes = await fetch(`${API_URL}/salons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: "Trimma Test Salon " + Date.now(),
        email: "admin@trimma.test",
        phone: "+94771234567",
        address: "Colombo 03",
        currency: "LKR"
      })
    });
    const salon = await salonRes.json();
    if (!salon.id) throw new Error("Failed to create Salon: " + JSON.stringify(salon));
    salonId = salon.id;
    console.log("✅ Success! Created Salon ID:", salonId, "\n");
    await delay(500);

    // 2. Create Service
    console.log("2️⃣  TESTING: Add Service (POST /salons/:id/services)");
    const serviceRes = await fetch(`${API_URL}/salons/${salonId}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: "Premium Haircut E2E",
        price: 2500,
        duration_minutes: 30,
        category: "hair",
        is_active: true
      })
    });
    const service = await serviceRes.json();
    if (!service.id) throw new Error("Failed to create Service: " + JSON.stringify(service));
    serviceId = service.id;
    console.log("✅ Success! Created Service ID:", serviceId, "\n");
    await delay(500);

    // 3. Create Staff
    console.log("3️⃣  TESTING: Add Staff (POST /salons/:id/staff)");
    const staffRes = await fetch(`${API_URL}/salons/${salonId}/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: "Kasun Test-Barber",
        role: "stylist",
        email: "kasun@trimma.test",
        working_hours: { "mon": ["09:00-17:00"] }
      })
    });
    const staff = await staffRes.json();
    if (!staff.id) throw new Error("Failed to create Staff: " + JSON.stringify(staff));
    staffId = staff.id;
    console.log("✅ Success! Created Staff ID:", staffId, "\n");
    await delay(500);

    // 4. Check Availability
    console.log("4️⃣  TESTING: Check Availability Engine (GET /salons/:id/availability)");
    const availRes = await fetch(`${API_URL}/salons/${salonId}/availability?date=2026-05-18&service_id=${serviceId}&staff_id=${staffId}`);
    const availability = await availRes.json();
    if (!availability.available_slots || availability.available_slots.length === 0) {
      throw new Error("Availability Engine failed: " + JSON.stringify(availability));
    }
    bookingTime = availability.available_slots[0];
    console.log("✅ Success! Found available slots:", availability.available_slots);
    console.log("📌 Selecting time slot:", bookingTime, "\n");
    await delay(500);

    // 5. Create Booking
    console.log("5️⃣  TESTING: The Booking Engine (POST /bookings)");
    const bookingRes = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        salon_id: salonId,
        service_id: serviceId,
        staff_id: staffId,
        customer_email: "thusitha.jayalath@gmail.com",
        date: "2026-05-18",
        time: bookingTime
      })
    });
    const booking = await bookingRes.json();
    if (!booking.booking_id) throw new Error("Failed to create Booking: " + JSON.stringify(booking));
    
    console.log("✅ Success! Booking Confirmed!");
    console.log("💳 Total Price:", booking.total_price);
    console.log("🆔 Booking ID:", booking.booking_id, "\n");

    console.log("==================================================");
    console.log("🎉 ALL 5 ENTERPRISE APIS PASSED!");
    console.log("==================================================");

  } catch (error) {
    console.error("❌ TEST FAILED:", error.message);
  }
}

runTests();
