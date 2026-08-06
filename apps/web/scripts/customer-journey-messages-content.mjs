/** Content for Trimma Customer Booking Journey & Notifications — A to Z (English). */

export const DOC_META = {
  title: "Trimma Customer Booking Journey",
  subtitle: "End-to-End Process & Customer Notifications (A to Z)",
  version: "June 2026",
  audience: "Product, Operations, Salon Partners, Meta Template Setup",
  footer: "Trimma — Sri Lanka Beauty & Wellness Booking Platform · trimma.lk",
  fileName: "Trimma-Customer-Booking-Journey-A-to-Z.docx",
};

export const SECTIONS = [
  {
    id: "overview",
    title: "1. Overview",
    paragraphs: [
      "Trimma uses a 30% online reservation deposit model. Customers pay 30% online to secure their slot; the remaining 70% is paid at the salon after the service.",
      "After successful payment, the booking is set to confirmed with payment status reservation_paid. The customer is notified immediately. There is no separate wait-for-salon-to-confirm step for new online bookings.",
    ],
    table: {
      headers: ["Payment", "When", "Amount"],
      rows: [
        ["Reservation deposit", "Online at checkout", "30% of service total"],
        ["Balance", "At the salon after service", "70% of service total"],
      ],
    },
  },
  {
    id: "discovery",
    title: "2. Phase A — Discovery & Account (Optional)",
    paragraphs: [
      "Customers can browse salons without an account. Sign-in with Google is optional and unlocks My Bookings, favourite salons, saved styles, and reviews.",
    ],
    table: {
      headers: ["Step", "Customer action", "Trimma location"],
      rows: [
        ["Find salons", "Search by location, category, or service", "/salons, /category/..."],
        ["View salon", "Review services, staff, photos, deals", "/salons/{slug}"],
        ["Optional sign-in", "Google OAuth", "/login"],
      ],
    },
    subsections: [
      {
        title: "2.1 Messages at sign-up (Google login only)",
        paragraphs: [
          "These are not part of the booking flow. They fire only when a brand-new customer signs in with Google for the first time.",
        ],
        table: {
          headers: ["Trigger", "Channel", "When", "Typical delivery"],
          rows: [
            ["#11 Welcome — New Customer", "Email", "First Google login (new user)", "Works if enabled in Admin"],
            ["#11 Welcome — New Customer", "WhatsApp", "Same moment", "Usually blocked — needs phone at login + Meta welcome template"],
          ],
        },
      },
    ],
  },
  {
    id: "booking",
    title: "3. Phase B — Booking (Salon Page)",
    paragraphs: [
      "The customer taps Book on the salon profile. The Booking Sheet guides them through five steps before redirecting to secure checkout.",
    ],
    table: {
      headers: ["Step", "Screen", "Customer action"],
      rows: [
        ["1", "Select services", "Choose one or more services (or a deal package)"],
        ["2", "Choose stylist", "Pick a staff member"],
        ["3", "Date & time", "Pick date and available time slot (live availability check)"],
        ["4", "Your details", "Full name, email, and phone (phone required for WhatsApp)"],
        ["5", "Booking summary", "Review total, 30% deposit, and 70% balance"],
      ],
    },
    bullets: ["No customer messages are sent during these steps."],
  },
  {
    id: "checkout",
    title: "4. Phase C — Checkout & Payment",
    paragraphs: [
      "Checkout URL: /checkout/booking. Payment is processed via Stripe (card). Only the 30% reservation deposit is charged online. Phone number is mandatory.",
    ],
    bullets: [
      "Booking is created (initially pending / unpaid).",
      "Payment is recorded as success.",
      "Booking updates to confirmed + reservation_paid.",
      "Staff time slot is locked.",
      "Customer and salon notifications are dispatched.",
      "Customer is redirected to /checkout/booking/success.",
    ],
  },
  {
    id: "post-payment",
    title: "5. Phase D — Messages Immediately After Payment",
    paragraphs: [
      "These fire once per booking, immediately after successful payment. This is the most important notification moment for customers.",
    ],
    subsections: [
      {
        title: "5.1 Customer messages",
        table: {
          headers: ["Channel", "Admin / Meta name", "When", "Content summary"],
          rows: [
            [
              "WhatsApp",
              "confirmmessage (Meta)",
              "Right after payment",
              "Hello {name}, your booking at {salon} for {service} on {date} at {time} is confirmed",
            ],
            [
              "Email",
              "Booking Confirmed (trigger: confirmed)",
              "Right after payment",
              "Full confirmation: reference, date, time, service, total, 30% paid, 70% balance, salon address, maps link, My Bookings link",
            ],
          ],
        },
        bullets: [
          "One WhatsApp at checkout — uses Meta template confirmmessage (12 variables: name, salon, ref, date, time, service, total, deposit, balance, address, directions, bookings link).",
          "One email at checkout — richer detail including deposit, balance, and directions.",
          "Admin trigger #1 Reservation Payment Received exists in settings but is not sent on current checkout (legacy).",
          "If WhatsApp fails, the success page offers Resend WhatsApp receipt.",
        ],
      },
      {
        title: "5.2 Salon owner messages (reference — not sent to customer)",
        table: {
          headers: ["Channel", "Template / trigger", "Recipient"],
          rows: [
            ["In-app notification bell", "New paid booking", "Salon owner dashboard"],
            ["Email", "Booking Created — Owner", "Salon owner email"],
            ["WhatsApp", "appointment_confirmation_1 (Meta)", "Salon WhatsApp / phone on profile"],
            ["Telegram", "Mirror of owner alert", "If Telegram integration enabled"],
          ],
        },
      },
    ],
  },
  {
    id: "post-checkout",
    title: "6. Phase E — Post-Checkout Touchpoints",
    bullets: [
      "Success page (/checkout/booking/success): booking reference, WhatsApp status, resend option, link to My Bookings.",
      "Customer dashboard (/customer): upcoming bookings, history, balance due, review prompts.",
      "No additional automatic messages unless the customer uses Resend WhatsApp on the success page.",
    ],
  },
  {
    id: "lifecycle",
    title: "7. Phase F — Appointment Lifecycle Messages",
    paragraphs: [
      "Further customer messages depend on actions the salon takes in Dashboard → Bookings.",
    ],
    table: {
      headers: ["Event", "WhatsApp trigger", "Email trigger", "Meta note"],
      rows: [
        ["Salon reschedules", "Booking Rescheduled", "Booking Rescheduled", "WhatsApp needs Meta template for reliable delivery"],
        ["Salon cancels", "Booking Cancelled", "Booking Cancelled", "30% deposit non-refundable; contact salon"],
        ["Salon marks no-show", "No-show alert", "Per admin config", "WhatsApp needs Meta template"],
        ["Salon marks completed", "Review request", "Review request", "Includes link to leave a Trimma review"],
      ],
    },
    bullets: [
      "Customers request reschedule from My Bookings; salon must approve.",
      "Customers cannot self-cancel in the app — salon handles cancellations.",
      "Legacy owner Confirm on pending bookings: not used for new online bookings (auto-confirmed at payment).",
    ],
  },
  {
    id: "checklist",
    title: "8. Complete Customer Message Checklist",
    table: {
      headers: ["#", "Moment", "Email", "WhatsApp", "Meta required?", "Status"],
      rows: [
        ["0", "First Google sign-up", "Welcome", "Welcome", "Yes (WA)", "Email OK; WA usually blocked"],
        ["1", "Payment success (checkout)", "Confirmed", "confirmmessage", "Yes", "Working when Meta configured"],
        ["2", "Salon reschedules", "Rescheduled", "Rescheduled", "Yes", "Needs Meta template"],
        ["3", "Salon cancels", "Cancelled", "Cancelled", "Yes", "Needs Meta template"],
        ["4", "Visit completed", "Review", "Review", "Yes", "Needs Meta template"],
        ["5", "No-show", "—", "No-show", "Yes", "Needs Meta template"],
      ],
    },
  },
  {
    id: "timeline",
    title: "9. Customer Timeline (Simple View)",
    bullets: [
      "Day 0 — Books online, pays 30%, receives WhatsApp (confirmmessage) + email confirmation.",
      "Before appointment — Optional reschedule message if salon changes date/time.",
      "Appointment day — Pays remaining 70% at salon.",
      "After visit — Review invite when salon marks Completed; or cancellation / no-show message if applicable.",
    ],
  },
  {
    id: "admin",
    title: "10. Admin Configuration Reference",
    table: {
      headers: ["Location", "What to configure"],
      rows: [
        ["Admin → Global Settings → WhatsApp", "confirmmessage + language (e.g. en_US) for customer checkout"],
        ["Same page", "appointment_confirmation_1 for salon owner alerts (not customer)"],
        ["Admin → Global Settings → Email", "Confirmed, Rescheduled, Cancelled, Review, Welcome templates"],
        ["Per-trigger toggles", "Each WhatsApp and email trigger can be enabled or disabled"],
      ],
    },
  },
  {
    id: "gaps",
    title: "11. Known Gaps (Until Meta Templates Expanded)",
    bullets: [
      "Welcome (#11): No Meta template wired; Google sign-up rarely includes phone.",
      "Reschedule / Cancel / Review / No-show WhatsApp: still plain text — Meta blocks outside 24-hour window.",
      "Some FAQ copy still mentions pending until salon confirms — outdated vs auto-confirm at payment.",
    ],
  },
  {
    id: "summary",
    title: "12. Summary",
    paragraphs: [
      "The customer finds a salon, books a slot, pays 30% online, and immediately receives a WhatsApp (confirmmessage) and email confirmation. They attend the salon, pay the balance there, and may later receive reschedule, cancellation, or review messages depending on how the appointment ends.",
    ],
  },
];
