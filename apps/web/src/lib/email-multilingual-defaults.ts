/** Sinhala & Tamil default email bodies (English defaults live in email-templates.ts). */

export const EMAIL_BODY_DEFAULTS_SINHALA = {
  reservationPaid: `{customer_name} ආයුබෝවන්,

ඔබගේ 20% වෙන්කිරීම් ගෙවීම සාර්ථකයි — {salon_name} හි ඔබගේ වේලාව දැන් අගුළු දමා ඇත.

යොමු අංකය: {booking_no}
දිනය: {booking_date}
වේලාව: {booking_time}
සේවාව: {service_name}
ගෙවූ වෙන්කිරීම් ගාස්තුව: LKR {deposit_paid}
salonයේ ශේෂය: LKR {balance_to_pay}

salon හිමිකරු ඔබගේ වෙන්කිරීම තහවුරු කරන තෙක් කෙටි කාලයක් රැඳී සිටින්න. තහවුරු වූ පසු අපි ඔබට දැනුම් දෙමු.

ඔබගේ වෙන්කිරීම්: {dashboard_link}

Trimma තෝරා ගැනීමට ස්තූතියි.`,

  confirmed: `{customer_name} ආයුබෝවන්,

{salon_name} ඔබගේ appointment එක තහවුරු කර ඇත!

යොමු අංකය: {booking_no}
දිනය: {booking_date}
වේලාව: {booking_time}
සේවාව: {service_name}
මුළු මුදල: LKR {total_price}
ගෙවූ වෙන්කිරීම: LKR {deposit_paid}
salonයේ ශේෂය: LKR {balance_to_pay}

ලිපිනය: {salon_address}
සalonයට යාම: {maps_link}

Trimma තෝරා ගැනීමට ස්තූතියි.`,

  rescheduled: `{customer_name} ආයුබෝවන්,

{salon_name} හි ඔබගේ appointment එක නව දිනයකට වෙනස් කර ඇත.

නව දිනය: {booking_date}
නව වේලාව: {booking_time}
සේවාව: {service_name}

ලිපිනය: {salon_address}`,

  cancelled: `{customer_name} ආයුබෝවන්,

{salon_name} මගින් ඔබගේ appointment එක අවලංගු කර ඇත.

මුල් දිනය: {booking_date}
මුල් වේලාව: {booking_time}
සේවාව: {service_name}

Online වෙන්කිරීම් deposit එක non-refundable වේ.`,

  review: `{customer_name} ආයුබෝවන්,

{salon_name} හි ඔබගේ අත්දැකීම කෙසේද? ඔබගේ feedback එක අපිට වැදගත්.

Review එකක් ලියන්න: {review_link}`,

  onboarding: `{salon_name} හිමිකරු ආයුබෝවන්,

ඔබගේ salon Trimma හි verified වී ඇත.

{owner_gmail} භාවිතා කර login වන්න: {login_link}`,

  bookingCreatedCustomer: `{customer_name} ආයුබෝවන්,

{salon_name} හි {service_name} සඳහා ඔබගේ booking request එක ලැබී ඇත.

දිනය: {booking_date}
වේලාව: {booking_time}

Status: Salon confirmation එන තෙක් pending.`,

  bookingCreatedOwner: `{salon_name} සඳහා {customer_name} වෙතින් නව booking request එකක්.

සේවාව: {service_name}
දිනය: {booking_date}
වේලාව: {booking_time}
ගෙවීම: {payment_status}`,

  agentApprovalOwner: `{salon_name} agent approval ලබා live වී ඇත. Admin verified badge review කරනු ඇත.`,

  agentApprovalAdmin: `Agent approved salon: {salon_name}. Admin dashboard හි review කරන්න.`,

  adminApprovalOwner: `Trimma verified badge {salon_name} වෙත ලබා දී ඇත!`,

  adminApprovalAdmin: `Verified badge {salon_name} වෙත grant කර ඇත.`,

  welcomeCustomer: `{customer_name} ආයුබෝවන්,

Trimma වෙත සාදරයෙන් පිළිගනිමු — ශ්‍රී ලංකාවේ beauty & wellness booking platform එක.

Salon browse කර bookings manage කරන්න: {dashboard_link}`,

  agentLeadAssigned: `{agent_name} ආයුබෝවන්,

නව salon lead එකක් assign කර ඇත: {salon_name}
Location: {salon_address}
Status: {onboarding_status}`,

  partnerLeadReceived: `Hi {owner_name},

Trimma partner application ලැබුණා.

Business: {salon_name}
Location: {salon_address}

අපි ඉක්මනින් සම්බන්ධ වෙමු.`,
} as const;

export const EMAIL_BODY_DEFAULTS_TAMIL = {
  reservationPaid: `வணக்கம் {customer_name},

உங்கள் 20% reservation கட்டணம் வெற்றிகரமாக செலுத்தப்பட்டது — {salon_name} இல் உங்கள் நேரம் lock செய்யப்பட்டுள்ளது.

Reference: {booking_no}
தேதி: {booking_date}
நேரம்: {booking_time}
சேவை: {service_name}
செலுத்திய reservation fee: LKR {deposit_paid}
Salon இல் balance: LKR {balance_to_pay}

Salon owner உங்கள் booking-ஐ confirm செய்யும் வரை காத்திருக்கவும். Confirm ஆன பிறகு உங்களுக்கு தெரிவிப்போம்.

உங்கள் bookings: {dashboard_link}

Trimma-வை தேர்ந்தெடுத்ததற்கு நன்றி.`,

  confirmed: `வணக்கம் {customer_name},

{salon_name} உங்கள் appointment-ஐ confirm செய்துள்ளது!

Reference: {booking_no}
தேதி: {booking_date}
நேரம்: {booking_time}
சேவை: {service_name}
மொத்தம்: LKR {total_price}
Deposit: LKR {deposit_paid}
Salon balance: LKR {balance_to_pay}

முகவரி: {salon_address}
Directions: {maps_link}`,

  rescheduled: `வணக்கம் {customer_name},

{salon_name} இல் உங்கள் appointment புதிய தேதிக்கு reschedule செய்யப்பட்டுள்ளது.

புதிய தேதி: {booking_date}
புதிய நேரம்: {booking_time}
சேவை: {service_name}`,

  cancelled: `வணக்கம் {customer_name},

{salon_name} உங்கள் appointment-ஐ cancel செய்துள்ளது.

Original date: {booking_date}
Original time: {booking_time}
சேவை: {service_name}

Online reservation deposit refundable அல்ல.`,

  review: `வணக்கம் {customer_name},

{salon_name} இல் உங்கள் experience எப்படி இருந்தது? Review எழுதுங்கள்: {review_link}`,

  onboarding: `{salon_name} owner, உங்கள் salon Trimma-வில் verified.

{owner_gmail} மூலம் login: {login_link}`,

  bookingCreatedCustomer: `வணக்கம் {customer_name},

{salon_name} இல் {service_name} booking request பெறப்பட்டது.

தேதி: {booking_date}
நேரம்: {booking_time}
Status: Salon confirmation pending.`,

  bookingCreatedOwner: `{salon_name} க்கு {customer_name} இருந்து புதிய booking request.

சேவை: {service_name}
தேதி: {booking_date}
நேரம்: {booking_time}
Payment: {payment_status}`,

  agentApprovalOwner: `{salon_name} agent approval பெற live ஆகியுள்ளது.`,

  agentApprovalAdmin: `Agent approved: {salon_name}. Admin dashboard-இல் review செய்யவும்.`,

  adminApprovalOwner: `Trimma verified badge {salon_name} க்கு வழங்கப்பட்டது!`,

  adminApprovalAdmin: `Verified badge {salon_name} grant செய்யப்பட்டது.`,

  welcomeCustomer: `வணக்கம் {customer_name},

Trimma-வுக்கு welcome — Sri Lanka beauty & wellness booking platform.

Explore: {dashboard_link}`,

  agentLeadAssigned: `வணக்கம் {agent_name},

புதிய lead assign: {salon_name}
Location: {salon_address}
Status: {onboarding_status}`,

  partnerLeadReceived: `வணக்கம் {owner_name},

Trimma partner application பெறப்பட்டது.

Business: {salon_name}
Location: {salon_address}

விரைவில் தொடர்பு கொள்வோம்.`,
} as const;
