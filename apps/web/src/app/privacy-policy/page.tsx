const EFFECTIVE_DATE = "May 29, 2026";

const collectItems = [
  { label: "Identity & contact", text: "Your name, email address, and phone number." },
  { label: "Salon business data", text: "Salon profile, services, staff, pricing, schedules, and media you upload." },
  { label: "Booking data", text: "Appointments, selected services, stylists, dates, and times." },
  { label: "Payment data", text: "Reservation and payment details processed through our payment partners." },
  { label: "Device & location", text: "Device type, browser, IP-derived location, and usage analytics." },
  { label: "Reviews & communication", text: "Ratings, reviews, and messages you send through Trimma." },
  { label: "Social connections", text: "Profile data shared when you sign in with a social provider." },
];

const useItems = [
  "Provide and operate the Trimma platform and marketplace.",
  "Create, manage, and confirm bookings and appointments.",
  "Send booking, reservation, and account notifications.",
  "Measure and improve platform performance and reliability.",
  "Protect against fraud and keep the platform secure.",
  "Respond to your questions and provide customer support.",
];

const sharingItems = [
  { label: "Payment processors", text: "To securely process reservations and payments." },
  { label: "Service providers", text: "Trusted vendors that help us operate the platform." },
  { label: "Analytics tools", text: "To understand usage and improve the product." },
];

const rightsItems = [
  "Access the personal data we hold about you.",
  "Update or correct your information.",
  "Delete your account and associated data.",
  "Opt out of marketing communications at any time.",
];

const thirdPartyItems = [
  "Payment gateways for reservations and checkout.",
  "Analytics providers for usage insights.",
  "Social login integrations for authentication.",
];

function Section({
  index,
  title,
  children,
}: {
  index: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="scroll-mt-24">
      <div className="flex items-center gap-3 mb-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FFFD40] text-sm font-bold text-zinc-900">
          {index}
        </span>
        <h2 className="text-2xl font-bold text-zinc-900">{title}</h2>
      </div>
      <div className="space-y-4 pl-0 sm:pl-11">{children}</div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
        {/* Heading */}
        <header className="border-b border-zinc-100 pb-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#FFFD40]/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-yellow-700">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FFFD40]" />
            Legal
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-4 max-w-3xl text-gray-600 leading-7">
            This Privacy Policy explains how Trimma — the salon marketplace and
            operating system — collects, uses, and protects your information when
            you use our platform as a customer, salon owner, or partner.
          </p>
          <p className="mt-4 text-sm font-semibold text-zinc-500">
            Effective date:{" "}
            <span className="text-zinc-900">{EFFECTIVE_DATE}</span>
          </p>
        </header>

        {/* Sections */}
        <div className="space-y-10 pt-10">
          <Section index={1} title="Introduction">
            <p className="text-gray-600 leading-7">
              Trimma provides a platform that connects customers with salons and
              helps salon businesses manage their bookings, staff, and services.
              This policy describes what data we collect and how we handle it. By
              using Trimma, you agree to the practices described here.
            </p>
          </Section>

          <Section index={2} title="Information We Collect">
            <p className="text-gray-600 leading-7">
              Depending on how you use Trimma, we may collect the following:
            </p>
            <ul className="space-y-3">
              {collectItems.map((item) => (
                <li key={item.label} className="flex gap-3 text-gray-600 leading-7">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FFFD40]" />
                  <span>
                    <span className="font-semibold text-zinc-900">{item.label}:</span>{" "}
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          <Section index={3} title="How We Use Information">
            <ul className="space-y-3">
              {useItems.map((item) => (
                <li key={item} className="flex gap-3 text-gray-600 leading-7">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FFFD40]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section index={4} title="Information Sharing">
            <p className="text-gray-600 leading-7">
              <span className="font-semibold text-zinc-900">
                We do not sell your personal data.
              </span>{" "}
              We only share information with trusted parties who help us operate
              Trimma:
            </p>
            <ul className="space-y-3">
              {sharingItems.map((item) => (
                <li key={item.label} className="flex gap-3 text-gray-600 leading-7">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FFFD40]" />
                  <span>
                    <span className="font-semibold text-zinc-900">{item.label}:</span>{" "}
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          <Section index={5} title="Data Security">
            <p className="text-gray-600 leading-7">
              We apply industry-standard safeguards to protect your information,
              including encryption in transit and access controls. However, no
              method of transmission or storage is completely secure, and we
              cannot guarantee absolute security.
            </p>
          </Section>

          <Section index={6} title="Cookies">
            <p className="text-gray-600 leading-7">
              We use cookies and similar technologies to personalize your
              experience, remember your preferences, run analytics, and improve
              overall platform performance. You can control cookies through your
              browser settings.
            </p>
          </Section>

          <Section index={7} title="Your Rights">
            <p className="text-gray-600 leading-7">You have the right to:</p>
            <ul className="space-y-3">
              {rightsItems.map((item) => (
                <li key={item} className="flex gap-3 text-gray-600 leading-7">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FFFD40]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section index={8} title="Third-Party Services">
            <p className="text-gray-600 leading-7">
              Trimma integrates with third-party services that have their own
              privacy practices:
            </p>
            <ul className="space-y-3">
              {thirdPartyItems.map((item) => (
                <li key={item} className="flex gap-3 text-gray-600 leading-7">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FFFD40]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section index={9} title="Children's Privacy">
            <p className="text-gray-600 leading-7">
              Trimma is not intended for users under the age of 13. We do not
              knowingly collect personal data from children. If you believe a
              child has provided us information, please contact us so we can
              remove it.
            </p>
          </Section>

          <Section index={10} title="Policy Updates">
            <p className="text-gray-600 leading-7">
              We may update this Privacy Policy at any time. When we do, we will
              revise the effective date above and post the updated version on this
              page. Your continued use of Trimma after changes take effect means
              you accept the updated policy.
            </p>
          </Section>

          <Section index={11} title="Contact Us">
            <p className="text-gray-600 leading-7">
              If you have questions about this Privacy Policy or how your data is
              handled, contact our support team:
            </p>
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-6">
              <p className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
                Support Email
              </p>
              <a
                href="mailto:support@trimma.io"
                className="mt-1 inline-block text-lg font-bold text-zinc-900 underline decoration-[#FFFD40] decoration-2 underline-offset-4 hover:text-yellow-700"
              >
                support@trimma.io
              </a>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
