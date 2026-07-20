import { Sparkles } from "lucide-react";

const EFFECTIVE_DATE = "May 29, 2026";

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
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#ffde5a] text-sm font-bold text-zinc-900">
          {index}
        </span>
        <h2 className="text-2xl font-bold text-zinc-900">{title}</h2>
      </div>
      <div className="space-y-4 pl-0 sm:pl-11">{children}</div>
    </section>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3 text-gray-600 leading-7">
      <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ffde5a]" />
      <span>{children}</span>
    </li>
  );
}

export default function TermsPage() {
  return (
    <div className="bg-white text-zinc-900">
      {/* ── Hero — full background image, copy on left 50% (landing style) ── */}
      <section className="page-hero-shell home-hero home-hero-split relative min-h-[500px]">
        <img
          src="/assets/terms-hero.webp"
          alt=""
          width={1920}
          height={500}
          decoding="async"
          fetchPriority="high"
          className="home-hero-bg-image absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
        <div className="home-hero-left-overlay absolute inset-0 hidden lg:block pointer-events-none" aria-hidden="true" />
        <div className="home-hero-mobile-overlay lg:hidden absolute inset-0 pointer-events-none" aria-hidden="true" />

        <div className="container relative z-10 mx-auto max-w-7xl">
          <div className="home-hero-content-col home-hero-content hero-ink text-left w-full lg:w-1/2 flex flex-col justify-center p-[3%]">
            <div className="home-hero-top">
              <div className="hero-badge hero-eyebrow inline-flex items-center gap-2 px-4 py-1.5 mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                Legal
              </div>

              <h1 className="home-hero-title text-3xl sm:text-4xl md:text-5xl xl:text-5xl font-black tracking-tight">
                <span className="home-hero-title-line">Terms &amp;</span>
                <span className="home-hero-title-accent underline decoration-[#ffde5a] decoration-4 underline-offset-4">
                  Conditions
                </span>
              </h1>

              <p className="text-sm sm:text-base md:text-lg font-medium max-w-lg leading-relaxed">
                These Terms &amp; Conditions govern your access to and use of Trimma —
                the salon marketplace and operating system — whether you are a
                customer, a salon owner, or a partner. Please read them carefully.
              </p>
              <p className="mt-4 text-sm font-semibold">
                Effective date: <span>{EFFECTIVE_DATE}</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="space-y-10">
          <Section index={1} title="Acceptance of Terms">
            <p className="text-gray-600 leading-7">
              By creating an account, booking a service, listing a salon, or
              otherwise using Trimma, you agree to be bound by these Terms and our
              Privacy Policy. If you do not agree, please do not use the platform.
            </p>
          </Section>

          <Section index={2} title="Eligibility">
            <p className="text-gray-600 leading-7">
              You must be at least 18 years old, or the age of majority in your
              jurisdiction, to create an account and make bookings. By using
              Trimma you confirm that the information you provide is accurate and
              that you are legally able to enter into these Terms.
            </p>
          </Section>

          <Section index={3} title="Accounts &amp; Registration">
            <ul className="space-y-3">
              <Bullet>You are responsible for keeping your login credentials secure.</Bullet>
              <Bullet>You are responsible for all activity that occurs under your account.</Bullet>
              <Bullet>You must provide accurate, current, and complete information.</Bullet>
              <Bullet>Notify us promptly of any unauthorized use of your account.</Bullet>
            </ul>
          </Section>

          <Section index={4} title="Bookings &amp; Reservations">
            <p className="text-gray-600 leading-7">
              Trimma is a marketplace that connects customers with independent
              salons. When you book, you enter into a service agreement directly
              with the salon. Trimma facilitates the booking, reservation, and
              communication but is not the provider of the salon services.
            </p>
            <ul className="space-y-3">
              <Bullet>Bookings are confirmed once the salon accepts the reservation.</Bullet>
              <Bullet>Service availability, pricing, and timing are set by each salon.</Bullet>
              <Bullet>You agree to arrive on time and follow the salon&apos;s reasonable policies.</Bullet>
            </ul>
          </Section>

          <Section index={5} title="Payments, Fees &amp; Reservation Deposits">
            <p className="text-gray-600 leading-7">
              Online bookings require a <strong className="text-zinc-800 font-semibold">30% reservation deposit</strong> paid
              at checkout (of the service total), with the remaining <strong className="text-zinc-800 font-semibold">70%</strong> payable
              at the salon after your service. Of that 30% deposit, Trimma retains a <strong className="text-zinc-800 font-semibold">10%</strong> platform
              share and the salon receives a <strong className="text-zinc-800 font-semibold">20%</strong> upfront share (both as percentages of the
              full service price). Payments are handled by our third-party payment processors. Exact amounts are shown before you confirm.
            </p>
          </Section>

          <Section index={6} title="Cancellations, Reschedules &amp; Refunds">
            <ul className="space-y-3">
              <Bullet>Cancellation and reschedule windows are set by each salon.</Bullet>
              <Bullet>The 30% online reservation deposit is non-refundable under Trimma&apos;s standard booking policy.</Bullet>
              <Bullet>No refunds for reservation deposits are processed through Trimma; contact the salon for appointment changes.</Bullet>
              <Bullet>Reschedule requests are subject to salon approval and availability.</Bullet>
            </ul>
          </Section>

          <Section index={7} title="Salon Partner Obligations">
            <p className="text-gray-600 leading-7">If you list a salon on Trimma, you agree to:</p>
            <ul className="space-y-3">
              <Bullet>Provide accurate business, service, pricing, and availability information.</Bullet>
              <Bullet>Honor confirmed bookings and deliver services professionally.</Bullet>
              <Bullet>Comply with all applicable laws, licenses, and health regulations.</Bullet>
              <Bullet>Handle customer data responsibly and respect customer privacy.</Bullet>
            </ul>
          </Section>

          <Section index={8} title="Customer Conduct">
            <p className="text-gray-600 leading-7">
              You agree not to misuse the platform, submit false bookings, harass
              salons or staff, or use Trimma for any unlawful purpose. We may
              suspend accounts that violate these Terms.
            </p>
          </Section>

          <Section index={9} title="Reviews &amp; Content">
            <p className="text-gray-600 leading-7">
              You may post reviews and content that are honest, lawful, and based
              on genuine experiences. You grant Trimma a license to display and
              distribute that content on the platform. We may remove content that
              is abusive, misleading, or violates these Terms.
            </p>
          </Section>

          <Section index={10} title="Intellectual Property">
            <p className="text-gray-600 leading-7">
              Trimma, its logo, design, and software are owned by Trimma and
              protected by intellectual property laws. You may not copy, modify,
              or distribute any part of the platform without our written
              permission.
            </p>
          </Section>

          <Section index={11} title="Disclaimers &amp; Limitation of Liability">
            <p className="text-gray-600 leading-7">
              Trimma is provided on an &quot;as is&quot; and &quot;as available&quot; basis. We do
              not guarantee that services booked through the platform will meet
              your expectations, as those services are provided by independent
              salons. To the maximum extent permitted by law, Trimma is not liable
              for indirect or consequential damages arising from your use of the
              platform.
            </p>
          </Section>

          <Section index={12} title="Termination">
            <p className="text-gray-600 leading-7">
              We may suspend or terminate your access to Trimma at any time if you
              breach these Terms or use the platform in a way that harms other
              users, salons, or Trimma. You may close your account at any time.
            </p>
          </Section>

          <Section index={13} title="Changes to These Terms">
            <p className="text-gray-600 leading-7">
              We may update these Terms from time to time. When we do, we will
              revise the effective date above and post the updated version on this
              page. Continued use of Trimma after changes take effect means you
              accept the updated Terms.
            </p>
          </Section>

          <Section index={14} title="Governing Law">
            <p className="text-gray-600 leading-7">
              These Terms are governed by the laws of Sri Lanka, without regard to
              conflict-of-law principles. Any disputes will be subject to the
              courts of competent jurisdiction in Sri Lanka.
            </p>
          </Section>

          <Section index={15} title="Contact Us">
            <p className="text-gray-600 leading-7">
              Questions about these Terms? Reach our support team:
            </p>
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-6">
              <p className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
                Support Email
              </p>
              <a
                href="mailto:support@trimma.io"
                className="mt-1 inline-block text-lg font-bold text-zinc-900 underline decoration-[#ffde5a] decoration-2 underline-offset-4 hover:text-yellow-700"
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
