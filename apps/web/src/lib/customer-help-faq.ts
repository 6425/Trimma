export type CustomerHelpFaq = {
  q: string;
  a: string;
};

export const CUSTOMER_HELP_FAQS: CustomerHelpFaq[] = [
  {
    q: "Do I need an account to book?",
    a: "No. You can browse salons and pay the deposit as a guest. Sign in with Google when you want My Bookings, favorite salons, saved styles, and reviews in your customer dashboard.",
  },
  {
    q: "How much do I pay online vs at the salon?",
    a: "Trimma collects a 20% reservation deposit online to secure your slot. The remaining 80% is paid at the salon after your service.",
  },
  {
    q: "What does pending vs confirmed mean?",
    a: "After checkout your booking is pending until the salon owner confirms it. You receive email and WhatsApp updates when the reservation is paid and again when the salon confirms.",
  },
  {
    q: "When will I receive notifications?",
    a: "Right after payment you get a reservation receipt. When the salon confirms, you get a confirmation message. You may also receive reschedule, cancellation, or review invitations depending on what happens with your appointment.",
  },
  {
    q: "Can I reschedule my appointment?",
    a: "Open My Bookings in your dashboard, choose Request reschedule, and pick a new date and time. The salon must approve the request before the new slot is final.",
  },
  {
    q: "Can I cancel a booking?",
    a: "Contact the salon directly for urgent changes. For general Trimma guidance, see our Cancellation options page at /cancellation-help.",
  },
  {
    q: "When can I leave a review?",
    a: "After your confirmed appointment time has passed, open My Bookings and use the Ready to review tab. You can submit one review per booking.",
  },
  {
    q: "How do Favorite Salons and Saved Styles work?",
    a: "Tap the heart on a salon while signed in to save it under Favorite Salons. Save hairstyle inspiration from the Styles gallery to Saved Styles and show your stylist at the visit.",
  },
  {
    q: "Where do I update my phone or name?",
    a: "Go to Profile in your customer dashboard. Your email comes from Google sign-in and is read-only in Trimma.",
  },
];

export const CUSTOMER_DASHBOARD_OPTIONS = [
  {
    title: "Dashboard",
    path: "/customer",
    description: "Your home screen with upcoming appointments, booking stats, and quick links after sign-in.",
  },
  {
    title: "My Bookings",
    path: "/customer/bookings",
    description: "View all appointments, request a reschedule, check deposit and balance, and leave reviews.",
  },
  {
    title: "Favorite Salons",
    path: "/customer/favorites",
    description: "Salons you saved with the heart icon for faster rebooking.",
  },
  {
    title: "Saved Styles",
    path: "/customer/styles",
    description: "Style inspiration you saved from the Trimma Styles gallery.",
  },
  {
    title: "Profile",
    path: "/customer/profile",
    description: "Update your name and phone number used for bookings and WhatsApp alerts.",
  },
  {
    title: "Support",
    path: "/customer/support",
    description: "Contact Trimma by email or WhatsApp (+94 712205515) for booking and account help.",
  },
] as const;
