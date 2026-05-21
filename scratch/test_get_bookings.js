import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const API_URL = 'http://localhost:4000/api/v1';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  console.log("==================================================");
  console.log("🚀 STARTING GET BOOKINGS ENDPOINT VERIFICATION");
  console.log("==================================================\n");

  let salonId, serviceId, staffId, bookingTime;

  try {
    // 1. Create Salon
    console.log("1️⃣  Creating Salon (POST /salons)...");
    const salonRes = await fetch(`${API_URL}/salons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: "Test Salon " + Date.now(),
        email: "test-owner-" + Date.now() + "@example.com",
        phone: "+94771234567",
        address: "Colombo 03",
        currency: "LKR"
      })
    });
    const salon = await salonRes.json();
    if (!salon.id) throw new Error("Failed to create Salon: " + JSON.stringify(salon));
    salonId = salon.id;
    console.log("✅ Created Salon ID:", salonId, "\n");
    await delay(500);

    // 2. Create Service
    console.log("2️⃣  Creating Service (POST /salons/:id/services)...");
    const serviceRes = await fetch(`${API_URL}/salons/${salonId}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: "Test Haircut",
        price: 1500,
        duration_minutes: 30,
        category: "hair",
        is_active: true
      })
    });
    const service = await serviceRes.json();
    if (!service.id) throw new Error("Failed to create Service: " + JSON.stringify(service));
    serviceId = service.id;
    console.log("✅ Created Service ID:", serviceId, "\n");
    await delay(500);

    // 3. Create Staff
    console.log("3️⃣  Creating Staff (POST /salons/:id/staff)...");
    const staffRes = await fetch(`${API_URL}/salons/${salonId}/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: "Kasun Test-Barber",
        role: "stylist",
        email: "kasun-" + Date.now() + "@example.com",
        working_hours: { "mon": ["09:00-17:00"] }
      })
    });
    const staff = await staffRes.json();
    if (!staff.id) throw new Error("Failed to create Staff: " + JSON.stringify(staff));
    staffId = staff.id;
    console.log("✅ Created Staff ID:", staffId, "\n");
    await delay(500);

    // 4. Create Booking
    console.log("4️⃣  Creating Booking (POST /bookings)...");
    const bookingRes = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        salon_id: salonId,
        service_id: serviceId,
        staff_id: staffId,
        customer_email: "test-customer@example.com",
        date: "2026-05-18",
        time: "09:00"
      })
    });
    const booking = await bookingRes.json();
    if (!booking.booking_id) throw new Error("Failed to create Booking: " + JSON.stringify(booking));
    console.log("✅ Created Booking ID:", booking.booking_id, "\n");
    await delay(500);

    // 5. Test GET /salons/:salonId/bookings
    console.log("5️⃣  Verifying Route (GET /salons/:salonId/bookings)...");
    const getRes = await fetch(`${API_URL}/salons/${salonId}/bookings`);
    if (!getRes.ok) {
      throw new Error(`Failed to GET bookings: ${getRes.status} ${getRes.statusText}`);
    }
    const bookingsList = await getRes.json();
    console.log("✅ Bookings returned:", bookingsList);
    
    if (bookingsList.length === 0) {
      throw new Error("Returned bookings list is empty, expected 1 booking");
    }
    const foundBooking = bookingsList.find(b => b.id === booking.booking_id);
    if (!foundBooking) {
      throw new Error("Could not find the newly created booking in the bookings list");
    }
    console.log("\n🎉 SUCCESS! GET /salons/:salonId/bookings returned the correct booking:", foundBooking);

  } catch (error) {
    console.error("❌ TEST FAILED:", error.message);
  }
}

runTests();
