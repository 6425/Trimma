/**
 * Trilingual content for the Trimma Customer Booking Guide PDF.
 * Used by scripts/generate-booking-guide-pdfs.mjs
 */

export const BRAND = {
  gold: "#ffde5a",
  goldDark: "#E6E43A",
  black: "#0B0B0B",
  ink: "#1A1C29",
  muted: "#64748b",
};

export const GUIDE_META = {
  en: {
    lang: "en",
    slug: "booking-guide-en",
    fileName: "trimma-booking-guide-en.pdf",
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    coverTitle: "Trimma Customer Booking Guide",
    coverSubtitle: "Find. Book. Glow. — Sri Lanka's Premium Grooming Marketplace",
    coverTagline: "A complete step-by-step guide for new and potential customers",
    footer: "© Trimma — The Salon Engine · trimma.io · support@trimma.io",
    depositNote: "30% reservation deposit online · 70% balance at the salon",
    stepsLabel: "Steps",
    tipLabel: "Pro tip",
  },
  si: {
    lang: "si",
    slug: "booking-guide-si",
    fileName: "trimma-booking-guide-si.pdf",
    fontFamily: "'Noto Sans Sinhala', 'Segoe UI', sans-serif",
    coverTitle: "ට්‍රිම්මා පාරිභෝගික වෙන්කරණ මාර්ගෝපදේශය",
    coverSubtitle: "සොයන්න. වෙන්කරන්න. දිදුලන්න. — ශ්‍රී ලංකාවේ Premium Grooming Marketplace",
    coverTagline: "නව සහ අනාගත පාරිභෝගිකයින් සඳහා සම්පූර්ණ පියවරෙන් පියවර මාර්ගෝපදේශය",
    footer: "© Trimma — The Salon Engine · trimma.io · support@trimma.io",
    depositNote: "අන්තර්ජාලයෙන් 30% තැන්පතුව · සැලුනේ 70% ශේෂය",
    stepsLabel: "පියවර",
    tipLabel: "උපදෙස්",
  },
  ta: {
    lang: "ta",
    slug: "booking-guide-ta",
    fileName: "trimma-booking-guide-ta.pdf",
    fontFamily: "'Noto Sans Tamil', 'Segoe UI', sans-serif",
    coverTitle: "ட்ரிம்மா வாடிக்கையாளர் முன்பதிவு வழிகாட்டி",
    coverSubtitle: "கண்டறியுங்கள். முன்பதிவு செய்யுங்கள். பிரகாசியுங்கள். — இலங்கையின் Premium Grooming Marketplace",
    coverTagline: "புதிய மற்றும் வருங்கால வாடிக்கையாளர்களுக்கான முழுமையான படிப்படியான வழிகாட்டி",
    footer: "© Trimma — The Salon Engine · trimma.io · support@trimma.io",
    depositNote: "ஆன்லைனில் 30% முன்பணம் · சலூனில் 70% மீதம்",
    stepsLabel: "படிகள்",
    tipLabel: "உதவிக்குறிப்பு",
  },
};

/** @type {Record<'en'|'si'|'ta', Array<{ title: string; body: string; tip?: string; visual: string }>>} */
export const GUIDE_STEPS = {
  en: [
    {
      title: "1. Visit the Trimma Marketplace",
      body: "Open trimma.io — Sri Lanka's beauty & wellness marketplace. Browse salons, barbers, spas, and wellness studios without signing in.",
      tip: "Use the Locations hub if you know your area but not a specific salon name.",
      visual: "marketplace",
    },
    {
      title: "2. Search by Location & Service",
      body: "Use the hero search widget: enter your area, the service you need (e.g. haircut, facial, manicure), and optionally a preferred date. On the search page, filter results by location dropdown.",
      visual: "search",
    },
    {
      title: "3. Open a Salon Profile",
      body: "Each salon has a public profile with cover photo, services, stylists, gallery, reviews, working hours, and amenities. Tap Book to start your appointment.",
      tip: "Check working hours before choosing a time — they control available slots.",
      visual: "salon",
    },
    {
      title: "4. Booking — Select Services (Step 1)",
      body: "In the booking sheet, choose one or more services from the menu. Multi-service bookings combine duration for slot length. Only active services are shown.",
      visual: "step-services",
    },
    {
      title: "5. Booking — Choose Stylist (Step 2)",
      body: "Pick your preferred stylist or select Any Available. Staff profiles show ratings and specialties to help you decide.",
      visual: "step-stylist",
    },
    {
      title: "6. Booking — Date & Time (Step 3)",
      body: "Select a date and an open time slot from real-time availability. Already-booked times are not selectable. If a slot disappears, refresh and pick the next open time.",
      visual: "step-datetime",
    },
    {
      title: "7. Booking — Your Details (Step 4)",
      body: "Enter your full name, email, and Sri Lankan phone number. Use phone lookup to autofill if you have booked before. Optional: gender, birthday, and notes for your stylist.",
      tip: "Use the same email for booking and Google sign-in so appointments appear in My Bookings.",
      visual: "step-details",
    },
    {
      title: "8. Booking — Summary & Policies (Step 5)",
      body: "Review services, stylist, date/time, and the 30% deposit vs 70% salon balance. Acknowledge the non-refundable deposit and rescheduling policy, then tap Continue to Payment.",
      visual: "step-summary",
    },
    {
      title: "9. Checkout — Pay 30% Deposit",
      body: "On the secure Stripe checkout page, pay the reservation deposit (e.g. LKR 210 on a LKR 700 service). Your booking reference (TRM-…) is assigned after successful payment.",
      visual: "checkout",
    },
    {
      title: "10. Confirmation Notifications",
      body: "You receive an email receipt immediately. WhatsApp sends a pending message after payment, then a confirmed message once the salon accepts your slot.",
      tip: "Add your mobile number in booking Step 4 for WhatsApp updates.",
      visual: "whatsapp",
    },
    {
      title: "11. Visit the Salon & Pay Balance",
      body: "Attend your appointment and pay the remaining 70% directly at the salon after your service. Keep your booking reference for check-in.",
      visual: "visit",
    },
    {
      title: "12. Sign In with Google",
      body: "Create a free account at /signup or sign in at /login using Google. Guest bookings work without an account — sign in with the same Google email to manage appointments.",
      visual: "account",
    },
    {
      title: "13. My Bookings & Reviews",
      body: "View all appointments under My Bookings. After your confirmed visit time passes, leave a star rating and optional review (20+ characters) from the Ready to review tab.",
      visual: "reviews",
    },
  ],
  si: [
    {
      title: "1. ට්‍රිම්මා Marketplace වෙත පිවිසෙන්න",
      body: "trimma.io විවෘත කරන්න — ශ්‍රී ලංකාවේ සුන්දරත්ව සහ සුව මධ්‍යස්ථාන Marketplace. ලොග් වීමෙන් තොරව සැලුන්, බාබර්, ස්පා සහ wellness studio සොයා බලන්න.",
      tip: "ඔබගේ ප්‍රදේශය දන්නා නමුත් නිශ්චිත සැලුන් නාමය නොදන්නේ නම් Locations hub භාවිතා කරන්න.",
      visual: "marketplace",
    },
    {
      title: "2. ප්‍රදේශය සහ සේවාව අනුව සොයන්න",
      body: "Hero search widget භාවිතා කරන්න: ඔබගේ ප්‍රදේශය, අවශ්‍ය සේවාව (උදා: කෙට්, facial, manicure) සහ අවශ්‍ය නම් දිනය ඇතුළත් කරන්න. Search පිටුවේ location dropdown මගින් ප්‍රතිඵල පෙරහන් කරන්න.",
      visual: "search",
    },
    {
      title: "3. සැලුන් පැතිකඩ විවෘත කරන්න",
      body: "සෑම සැලුනකටම cover photo, සේවා, stylist, gallery, reviews, වැඩ කරන වේලාව සහ amenities සහිත පොදු පැතිකඩක් ඇත. Book ඔබන්න වේලාව වෙන්කර ගැනීම ආරම්භ කිරීමට.",
      tip: "වේලාව තෝරන්නට පෙර වැඩ කරන වේලාව පරීක්ෂා කරන්න — ඒවා ලබා ගත හැකි slots පාලනය කරයි.",
      visual: "salon",
    },
    {
      title: "4. වෙන්කරණය — සේවා තෝරන්න (පියවර 1)",
      body: "Booking sheet හි menu එකෙන් එක් හෝ වැඩි සේවා තෝරන්න. බහු-සේවා වෙන්කරණ slot දිග ඒකාබද්ධ කරයි.",
      visual: "step-services",
    },
    {
      title: "5. වෙන්කරණය — Stylist තෝරන්න (පියවර 2)",
      body: "ඔබ කැමති stylist තෝරන්න හෝ Any Available තෝරන්න. Staff profiles ratings සහ specialties පෙන්වයි.",
      visual: "step-stylist",
    },
    {
      title: "6. වෙන්කරණය — දිනය සහ වේලාව (පියවර 3)",
      body: "දිනයක් සහ real-time ලබා ගත හැකි time slot එකක් තෝරන්න. දැනටමත් වෙන්කර ඇති වේලාවන් තෝරා ගත නොහැක. Slot එක අතුරුදහන් වුවහොත් refresh කර ඊළඟ open slot එක තෝරන්න.",
      visual: "step-datetime",
    },
    {
      title: "7. වෙන්කරණය — ඔබගේ විස්තර (පියවර 4)",
      body: "සම්පූර්ණ නම, email සහ ශ්‍රී ලංකා දුරකථන අංකය ඇතුළත් කරන්න. Phone lookup මගින් පෙර වෙන්කරණ autofill කරන්න. විකල්ප: gender, birthday සහ stylist notes.",
      tip: "වෙන්කරණය සහ Google sign-in සඳහා එකම email භාවිතා කර My Bookings හි appointments දකින්න.",
      visual: "step-details",
    },
    {
      title: "8. වෙන්කරණය — සාරාංශය සහ ප්‍රතිපත්ති (පියවර 5)",
      body: "සේවා, stylist, දිනය/වේලාව සහ 30% තැන්පතුව vs 70% සැලුන් ශේෂය සමාලෝචනය කරන්න. Non-refundable deposit සහ rescheduling ප්‍රතිපත්ති පිළිගෙන Continue to Payment ඔබන්න.",
      visual: "step-summary",
    },
    {
      title: "9. Checkout — 30% තැන්පතුව ගෙවන්න",
      body: "ආරක්ෂිත Stripe checkout පිටුවේ reservation deposit ගෙවන්න (උදා: LKR 700 සේවාවක LKR 210). සාර්ථක ගෙවීමෙන් පසු booking reference (TRM-…) ලැබේ.",
      visual: "checkout",
    },
    {
      title: "10. තහවුරු කිරීම් දැනුම්දීම්",
      body: "වහාම email receipt ලැබේ. ගෙවීමෙන් පසු WhatsApp pending message, සැලුන් slot එක පිළිගත් පසු confirmed message ලැබේ.",
      tip: "WhatsApp updates සඳහා booking පියවර 4 හි mobile අංකය එක් කරන්න.",
      visual: "whatsapp",
    },
    {
      title: "11. සැලුනට පැමිණ ශේෂය ගෙවන්න",
      body: "ඔබගේ appointment එකට පැමිණ සේවාවෙන් පසු සැලුනේ 70% ශේෂය සෘජුවම ගෙවන්න. Check-in සඳහා booking reference තබා ගන්න.",
      visual: "visit",
    },
    {
      title: "12. Google සමඟ Sign In කරන්න",
      body: "/signup හි නොමිලේ account එකක් සාදන්න හෝ /login හි Google භාවිතා කර sign in කරන්න. Guest bookings account එකක් නොමැතිව ක්‍රියා කරයි — appointments කළමනාකරණයට එකම Google email භාවිතා කරන්න.",
      visual: "account",
    },
    {
      title: "13. My Bookings සහ Reviews",
      body: "My Bookings හි සියලු appointments බලන්න. තහවුරු කළ visit වේලාව ගත වූ පසු Ready to review tab හි star rating සහ විකල්ප සමාලෝචනය (අක්ෂර 20+) ලියන්න.",
      visual: "reviews",
    },
  ],
  ta: [
    {
      title: "1. ட்ரிம்மா Marketplace-ஐ பார்வையிடுங்கள்",
      body: "trimma.io திறக்கவும் — இலங்கையின் அழகு & wellness marketplace. உள்நுழைவு இல்லாமல் சலூன்கள், பார்பர், ஸ்பா மற்றும் wellness studio-களை உலாவுங்கள்.",
      tip: "உங்கள் பகுதி தெரிந்தாலும் குறிப்பிட்ட சலூன் பெயர் தெரியவில்லை என்றால் Locations hub பயன்படுத்துங்கள்.",
      visual: "marketplace",
    },
    {
      title: "2. இடம் & சேவை மூலம் தேடுங்கள்",
      body: "Hero search widget பயன்படுத்துங்கள்: உங்கள் பகுதி, தேவையான சேவை (எ.கா. haircut, facial, manicure) மற்றும் விருப்பமான தேதியை உள்ளிடுங்கள். Search பக்கத்தில் location dropdown மூலம் வடிகட்டுங்கள்.",
      visual: "search",
    },
    {
      title: "3. சலூன் சுயவிவரத்தைத் திறக்கவும்",
      body: "ஒவ்வொரு சலூனுக்கும் cover photo, சேவைகள், stylist, gallery, reviews, வேலை நேரம் மற்றும் amenities உள்ள பொது சுயவிவரம் உள்ளது. Book என்பதை அழுத்தி முன்பதிவைத் தொடங்குங்கள்.",
      tip: "நேரம் தேர்ந்தெடுப்பதற்கு முன் வேலை நேரத்தைச் சரிபார்க்கவும் — அவை கிடைக்கும் slots-ஐ கட்டுப்படுத்துகின்றன.",
      visual: "salon",
    },
    {
      title: "4. முன்பதிவு — சேவைகளைத் தேர்ந்தெடுக்கவும் (படி 1)",
      body: "Booking sheet-ல் menu-யிலிருந்து ஒன்று அல்லது அதற்கு மேற்பட்ட சேவைகளைத் தேர்ந்தெடுக்கவும். பல சேவை முன்பதிவுகள் slot நீளத்தை இணைக்கின்றன.",
      visual: "step-services",
    },
    {
      title: "5. முன்பதிவு — Stylist தேர்வு (படி 2)",
      body: "விருப்பமான stylist-ஐத் தேர்ந்தெடுக்கவும் அல்லது Any Available தேர்ந்தெடுக்கவும். Staff profiles ratings மற்றும் specialties காட்டுகின்றன.",
      visual: "step-stylist",
    },
    {
      title: "6. முன்பதிவு — தேதி & நேரம் (படி 3)",
      body: "தேதியையும் real-time கிடைக்கும் time slot-ஐயும் தேர்ந்தெடுக்கவும். ஏற்கனவே முன்பதிவு செய்யப்பட்ட நேரங்கள் தேர்ந்தெடுக்க முடியாது. Slot மறைந்தால் refresh செய்து அடுத்த open slot தேர்ந்தெடுக்கவும்.",
      visual: "step-datetime",
    },
    {
      title: "7. முன்பதிவு — உங்கள் விவரங்கள் (படி 4)",
      body: "முழு பெயர், email மற்றும் இலங்கை மொபைல் எண்ணை உள்ளிடுங்கள். முன்பு முன்பதிவு செய்திருந்தால் phone lookup மூலம் autofill செய்யுங்கள். விருப்பம்: gender, birthday மற்றும் stylist notes.",
      tip: "முன்பதிவு மற்றும் Google sign-in-க்கு ஒரே email பயன்படுத்தி My Bookings-ல் appointments காணுங்கள்.",
      visual: "step-details",
    },
    {
      title: "8. முன்பதிவு — சுருக்கம் & கொள்கைகள் (படி 5)",
      body: "சேவைகள், stylist, தேதி/நேரம் மற்றும் 30% வைப்புத்தொகை vs 70% சலூன் மீதியை மதிப்பாய்வு செய்யுங்கள். Non-refundable deposit மற்றும் rescheduling கொள்கைகளை ஒப்புக்கொண்டு Continue to Payment அழுத்துங்கள்.",
      visual: "step-summary",
    },
    {
      title: "9. Checkout — 30% வைப்புத்தொகை செலுத்துங்கள்",
      body: "பாதுகாப்பான Stripe checkout பக்கத்தில் reservation deposit செலுத்துங்கள் (எ.கா. LKR 700 சேவைக்கு LKR 210). வெற்றிகரமான கட்டணத்திற்குப் பிறகு booking reference (TRM-…) கிடைக்கும்.",
      visual: "checkout",
    },
    {
      title: "10. உறுதிப்படுத்தல் அறிவிப்புகள்",
      body: "உடனடியாக email receipt கிடைக்கும். கட்டணத்திற்குப் பிறகு WhatsApp pending message, சலூன் slot ஏற்றுக்கொண்ட பிறகு confirmed message கிடைக்கும்.",
      tip: "WhatsApp updates-க்கு booking படி 4-ல் mobile எண்ணைச் சேர்க்கவும்.",
      visual: "whatsapp",
    },
    {
      title: "11. சலூனுக்குச் சென்று மீதியைச் செலுத்துங்கள்",
      body: "உங்கள் appointment-க்கு வந்து சேவைக்குப் பிறகு சலூனில் நேரடியாக 70% மீதியைச் செலுத்துங்கள். Check-in-க்கு booking reference வைத்திருங்கள்.",
      visual: "visit",
    },
    {
      title: "12. Google மூலம் Sign In செய்யுங்கள்",
      body: "/signup-ல் இலவச account உருவாக்குங்கள் அல்லது /login-ல் Google பயன்படுத்தி sign in செய்யுங்கள். Guest bookings account இல்லாமல் வேலை செய்கின்றன — appointments நிர்வகிக்க ஒரே Google email பயன்படுத்துங்கள்.",
      visual: "account",
    },
    {
      title: "13. My Bookings & Reviews",
      body: "My Bookings-ல் அனைத்து appointments-ஐயும் காணுங்கள். உறுதிப்படுத்தப்பட்ட visit நேரம் கடந்த பிறகு Ready to review tab-ல் star rating மற்றும் விருப்ப விமர்சனம் (20+ எழுத்துகள்) எழுதுங்கள்.",
      visual: "reviews",
    },
  ],
};

export function getVisualHtml(visualId) {
  const visuals = {
    marketplace: `
      <div class="mock dark">
        <div class="mock-title">Sri Lanka's Beauty & Wellness Marketplace</div>
        <div class="search-widget">
          <div class="sw-row"><span class="ico">📍</span> Where are you?</div>
          <div class="sw-row"><span class="ico">🔍</span> Haircut, colour, spa…</div>
          <div class="sw-row"><span class="ico">📅</span> Preferred date</div>
          <div class="sw-btn">Search</div>
        </div>
        <div class="mock-actions"><span class="pill gold">Book Now</span><span class="pill outline">List Your Business</span></div>
      </div>`,
    search: `
      <div class="mock light">
        <div class="mock-bar">Best Salons & Spas in Sri Lanka · 24 Salons Found</div>
        <div class="search-row"><span>🔍</span><span class="grow">Haircut, color, spa...</span><span class="chip">Search</span></div>
        <div class="card"><div class="thumb"></div><div><b>Sampath Barber Saloon</b><br/><small>★ 4.9 · Kadawatha, Gampaha</small><br/><span class="tag">Verified</span></div></div>
      </div>`,
    salon: `
      <div class="mock light">
        <div class="hero-band">Sampath Barber Saloon</div>
        <div class="svc"><div><b>Classic Haircut</b><br/><small>30 mins</small></div><div><b>LKR 700</b><br/><span class="chip gold">Book</span></div></div>
        <div class="svc dim"><div><b>Beard Trim</b><br/><small>15 mins</small></div><div><b>LKR 400</b></div></div>
      </div>`,
    "step-services": `
      <div class="mock sheet">
        <div class="sheet-head">Book at Sampath Barber Saloon · Step 1</div>
        <div class="step on">✓ 1. Services</div><div class="step">2. Stylist</div><div class="step">3. Date & Time</div>
        <div class="pick on">Classic Haircut — LKR 700</div><div class="pick">Beard Trim — LKR 400</div>
      </div>`,
    "step-stylist": `
      <div class="mock sheet">
        <div class="sheet-head">Step 2 — Choose Stylist</div>
        <div class="avatar-row on"><div class="av">KS</div><div><b>Kasun Silva</b><br/><small>★ 4.8 · Hair specialist</small></div></div>
        <div class="avatar-row"><div class="av dim">AA</div><div><b>Any Available</b><br/><small>Fastest open slot</small></div></div>
      </div>`,
    "step-datetime": `
      <div class="mock sheet">
        <div class="sheet-head">Step 3 — Date & Time</div>
        <div class="days"><span>Mon 12</span><span class="on">Tue 13</span><span>Wed 14</span></div>
        <div class="slots"><span>09:00</span><span>10:00</span><span class="on">11:00</span><span>14:00</span></div>
      </div>`,
    "step-details": `
      <div class="mock sheet">
        <div class="sheet-head">Step 4 — Your Details</div>
        <div class="field"><small>PHONE LOOKUP</small><div class="inp">+94 77 123 4567 · Find</div></div>
        <div class="field"><small>FULL NAME</small><div class="inp">Nimal Perera</div></div>
        <div class="field"><small>EMAIL</small><div class="inp">nimal@gmail.com</div></div>
      </div>`,
    "step-summary": `
      <div class="mock sheet">
        <div class="sheet-head">Step 5 — Summary</div>
        <div class="line"><span>Classic Haircut</span><span>LKR 700</span></div>
        <div class="line gold-box"><span>Deposit (30%)</span><b>LKR 210</b></div>
        <div class="line"><span>Balance at salon (70%)</span><span>LKR 490</span></div>
        <div class="check">☑ Non-refundable deposit acknowledged</div>
      </div>`,
    checkout: `
      <div class="mock light">
        <div class="mock-bar">Secure Stripe Checkout</div>
        <div class="line"><span>Classic Haircut · Tue 13 · 11:00</span></div>
        <div class="line gold-box"><span>Pay now (30%)</span><b>LKR 210</b></div>
        <div class="pay-btn">💳 Pay LKR 210</div>
        <div class="ref">Ref: TRM-482916</div>
      </div>`,
    whatsapp: `
      <div class="mock wa">
        <div class="wa-head">Trimma Alerts</div>
        <div class="bubble">Hi Nimal! 🎉 Your 30% payment for <b>Sampath Barber Saloon</b> is confirmed.<br/>📋 TRM-482916 · 📅 Tue 11:00 · ✅ LKR 210 paid · 💵 LKR 490 at salon</div>
      </div>`,
    visit: `
      <div class="mock dark center">
        <div class="big">✓</div>
        <b>Visit Complete</b>
        <div class="line"><span>Total</span><span>LKR 700</span></div>
        <div class="line"><span>Deposit paid</span><span>- LKR 210</span></div>
        <div class="line gold-box"><span>Paid at salon</span><b>LKR 490</b></div>
      </div>`,
    account: `
      <div class="mock light">
        <div class="mock-bar">Sign in with Google</div>
        <div class="g-btn">G Continue with Google</div>
        <div class="side">Dashboard · My Bookings · Favorites · Saved Styles</div>
      </div>`,
    reviews: `
      <div class="mock light center">
        <b>How was your visit?</b>
        <div class="stars">★★★★★</div>
        <div class="inp tall">Great haircut — friendly staff!</div>
        <div class="pay-btn dark">Submit Review</div>
      </div>`,
  };
  return visuals[visualId] || "";
}

export function buildGuideHtml(lang) {
  const meta = GUIDE_META[lang];
  const steps = GUIDE_STEPS[lang];

  const stepPages = steps
    .map(
      (step, idx) => `
    <section class="step-page">
      <div class="step-header">
        <span class="step-badge">${meta.stepsLabel} ${idx + 1}</span>
        <h2>${step.title}</h2>
      </div>
      <div class="step-grid">
        <div class="step-copy">
          <p>${step.body}</p>
          ${step.tip ? `<div class="tip"><strong>${meta.tipLabel}:</strong> ${step.tip}</div>` : ""}
        </div>
        <div class="step-visual">${getVisualHtml(step.visual)}</div>
      </div>
    </section>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="${meta.lang}">
<head>
  <meta charset="UTF-8" />
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Sinhala:wght@400;600;700&family=Noto+Sans+Tamil:wght@400;600;700&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: ${meta.fontFamily}; color: #18181b; background: #fff; font-size: 11pt; line-height: 1.55; }
    .cover {
      min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;
      background: linear-gradient(135deg, ${BRAND.gold} 0%, #FFFE99 45%, #fff8dc 100%);
      padding: 48px; text-align: center; page-break-after: always;
    }
    .logo { font-size: 28pt; font-weight: 900; letter-spacing: -1px; color: ${BRAND.black}; margin-bottom: 8px; }
    .logo span { color: ${BRAND.ink}; }
    .cover h1 { font-size: 22pt; font-weight: 900; color: ${BRAND.black}; max-width: 620px; margin: 24px 0 12px; line-height: 1.25; }
    .cover .sub { font-size: 12pt; color: #3f3f46; max-width: 520px; margin-bottom: 8px; }
    .cover .tag { font-size: 10pt; color: #52525b; max-width: 480px; }
    .deposit-pill {
      margin-top: 28px; display: inline-block; background: ${BRAND.black}; color: ${BRAND.gold};
      padding: 10px 20px; border-radius: 999px; font-weight: 700; font-size: 10pt;
    }
    .step-page { padding: 28px 36px 32px; page-break-after: always; min-height: 100vh; }
    .step-header { margin-bottom: 18px; border-bottom: 3px solid ${BRAND.gold}; padding-bottom: 12px; }
    .step-badge {
      display: inline-block; background: ${BRAND.gold}; color: ${BRAND.black};
      font-size: 8pt; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase;
      padding: 4px 10px; border-radius: 6px; margin-bottom: 8px;
    }
    .step-header h2 { font-size: 16pt; font-weight: 800; color: ${BRAND.black}; }
    .step-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start; }
    .step-copy p { color: #3f3f46; margin-bottom: 12px; }
    .tip {
      background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px;
      padding: 10px 12px; font-size: 9.5pt; color: #92400e;
    }
    .mock {
      border-radius: 14px; overflow: hidden; border: 1px solid #e4e4e7;
      box-shadow: 0 8px 24px rgba(0,0,0,0.08); font-size: 8.5pt;
    }
    .mock.dark { background: ${BRAND.black}; color: #fff; padding: 16px; }
    .mock.light { background: #f8fafc; padding: 14px; }
    .mock.sheet { background: #fff; }
    .mock.wa { background: #efeae2; }
    .mock.center { text-align: center; padding: 20px; }
    .mock-title { font-weight: 800; margin-bottom: 10px; font-size: 9pt; }
    .search-widget { background: ${BRAND.gold}; padding: 6px; border-radius: 10px; border: 2px solid rgba(255,255,255,0.25); }
    .sw-row { background: #fff; color: #71717a; padding: 7px 10px; border-radius: 6px; margin-bottom: 4px; }
    .sw-btn { background: ${BRAND.goldDark}; color: #000; font-weight: 800; text-align: center; padding: 7px; border-radius: 6px; margin-top: 4px; }
    .mock-actions { display: flex; gap: 6px; margin-top: 10px; }
    .pill { padding: 5px 10px; border-radius: 6px; font-weight: 700; font-size: 8pt; }
    .pill.gold { background: ${BRAND.gold}; color: #000; }
    .pill.outline { border: 1px solid ${BRAND.gold}; color: ${BRAND.gold}; }
    .mock-bar { background: ${BRAND.black}; color: #fff; padding: 8px 12px; font-weight: 700; font-size: 8pt; }
    .search-row { display: flex; gap: 8px; align-items: center; background: #fff; margin: 10px; padding: 8px; border-radius: 8px; border: 1px solid #e4e4e7; }
    .grow { flex: 1; color: #a1a1aa; font-weight: 600; }
    .chip { background: ${BRAND.gold}; color: #000; font-weight: 800; padding: 4px 8px; border-radius: 6px; font-size: 7.5pt; }
    .card { display: flex; gap: 10px; background: #fff; margin: 0 10px 10px; padding: 10px; border-radius: 10px; border: 1px solid #e4e4e7; }
    .thumb { width: 44px; height: 44px; background: #e4e4e7; border-radius: 8px; flex-shrink: 0; }
    .tag { display: inline-block; margin-top: 4px; background: rgba(255,222,90,0.15); color: #000; padding: 2px 6px; border-radius: 4px; font-size: 7pt; font-weight: 700; }
    .hero-band { background: ${BRAND.black}; color: #fff; padding: 12px; font-weight: 800; }
    .svc, .svc.dim { display: flex; justify-content: space-between; padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
    .svc.dim { opacity: 0.55; }
    .sheet-head { background: ${BRAND.black}; color: #fff; padding: 8px 12px; font-weight: 700; }
    .step { padding: 6px 12px; border-bottom: 1px solid #f1f5f9; color: #71717a; }
    .step.on { color: #000; font-weight: 800; }
    .pick { margin: 8px 12px; padding: 8px; border-radius: 8px; border: 1px solid #e4e4e7; }
    .pick.on { border-color: ${BRAND.gold}; background: rgba(255,222,90,0.08); font-weight: 700; }
    .avatar-row { display: flex; gap: 10px; padding: 10px 12px; border-bottom: 1px solid #f1f5f9; align-items: center; }
    .avatar-row.on { background: rgba(255,222,90,0.1); }
    .av { width: 32px; height: 32px; border-radius: 8px; background: ${BRAND.gold}; color: #000; font-weight: 800; display: flex; align-items: center; justify-content: center; }
    .av.dim { background: #e4e4e7; color: #71717a; }
    .days, .slots { display: flex; gap: 6px; padding: 10px 12px; flex-wrap: wrap; }
    .days span, .slots span { padding: 6px 10px; border-radius: 8px; background: #f4f4f5; font-weight: 600; }
    .days .on, .slots .on { background: ${BRAND.black}; color: #fff; }
    .field { padding: 8px 12px; }
    .field small { color: #a1a1aa; font-weight: 800; letter-spacing: 0.06em; font-size: 6.5pt; }
    .inp { margin-top: 4px; border: 1px solid #e4e4e7; border-radius: 8px; padding: 8px; font-weight: 600; color: #3f3f46; }
    .inp.tall { min-height: 48px; text-align: left; }
    .line { display: flex; justify-content: space-between; padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
    .gold-box { background: rgba(255,222,90,0.12); font-weight: 800; }
    .check { padding: 10px 12px; font-size: 8pt; color: #3f3f46; }
    .pay-btn { margin: 10px 12px; background: ${BRAND.black}; color: #fff; text-align: center; padding: 10px; border-radius: 10px; font-weight: 800; }
    .pay-btn.dark { background: ${BRAND.black}; }
    .ref { text-align: center; font-family: monospace; font-weight: 800; color: #059669; padding-bottom: 10px; }
    .wa-head { background: #00a884; color: #fff; padding: 8px 12px; font-weight: 700; }
    .bubble { background: #fff; margin: 12px; padding: 10px; border-radius: 10px; border-top-left-radius: 0; line-height: 1.45; }
    .big { font-size: 28pt; color: ${BRAND.gold}; margin-bottom: 8px; }
    .g-btn { margin: 14px; border: 1px solid #e4e4e7; border-radius: 10px; padding: 12px; text-align: center; font-weight: 700; background: #fff; }
    .side { margin: 0 14px 14px; font-size: 8pt; color: #71717a; text-align: center; }
    .stars { color: ${BRAND.gold}; font-size: 18pt; letter-spacing: 2px; margin: 8px 0; }
    .footer {
      padding: 16px 36px; text-align: center; font-size: 8pt; color: #71717a;
      border-top: 2px solid ${BRAND.gold};
    }
  </style>
</head>
<body>
  <section class="cover">
    <div class="logo">Trimma<span>.</span></div>
    <h1>${meta.coverTitle}</h1>
    <p class="sub">${meta.coverSubtitle}</p>
    <p class="tag">${meta.coverTagline}</p>
    <div class="deposit-pill">${meta.depositNote}</div>
  </section>
  ${stepPages}
  <div class="footer">${meta.footer}</div>
</body>
</html>`;
}
