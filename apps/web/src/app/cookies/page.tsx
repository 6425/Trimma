import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy | Trimma",
  description:
    "Learn how Trimma uses essential, analytics, functional, and marketing cookies on the salon booking platform.",
};

const EFFECTIVE_DATE = "May 29, 2026";

const cookieTypes = [
  {
    label: "Essential cookies",
    text: "Required for the platform to work — sign-in, sessions, security, and core booking flows. These cannot be switched off.",
  },
  {
    label: "Performance & analytics cookies",
    text: "Help us understand how the platform is used so we can measure and improve performance.",
  },
  {
    label: "Functional cookies",
    text: "Remember your preferences such as language, location, and saved salons or styles.",
  },
  {
    label: "Marketing cookies",
    text: "Used to show relevant offers and measure the effectiveness of campaigns.",
  },
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

export default function CookiePolicyPage() {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
        <header className="border-b border-zinc-100 pb-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#FFFD40]/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-yellow-700">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FFFD40]" />
            Legal
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl">
            Cookie Policy
          </h1>
          <p className="mt-4 max-w-3xl text-gray-600 leading-7">
            This Cookie Policy explains how Trimma uses cookies and similar
            technologies to recognize you, remember your preferences, and improve
            your experience on our platform.
          </p>
          <p className="mt-4 text-sm font-semibold text-zinc-500">
            Effective date: <span className="text-zinc-900">{EFFECTIVE_DATE}</span>
          </p>
        </header>

        <div className="space-y-10 pt-10">
          <Section index={1} title="What Are Cookies?">
            <p className="text-gray-600 leading-7">
              Cookies are small text files stored on your device when you visit a
              website. They help the site remember information about your visit,
              such as your sign-in status and preferences, which makes your next
              visit easier and the platform more useful to you.
            </p>
          </Section>

          <Section index={2} title="Types of Cookies We Use">
            <ul className="space-y-3">
              {cookieTypes.map((item) => (
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

          <Section index={3} title="How We Use Cookies">
            <ul className="space-y-3">
              <li className="flex gap-3 text-gray-600 leading-7">
                <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FFFD40]" />
                <span>Keep you signed in and secure your session.</span>
              </li>
              <li className="flex gap-3 text-gray-600 leading-7">
                <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FFFD40]" />
                <span>Personalize content and remember your preferences.</span>
              </li>
              <li className="flex gap-3 text-gray-600 leading-7">
                <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FFFD40]" />
                <span>Analyze usage to improve platform performance.</span>
              </li>
            </ul>
          </Section>

          <Section index={4} title="Third-Party Cookies">
            <p className="text-gray-600 leading-7">
              Some cookies are placed by trusted third parties we work with, such
              as analytics providers, payment gateways, and social login
              integrations. These providers have their own privacy and cookie
              practices, which we encourage you to review.
            </p>
          </Section>

          <Section index={5} title="Managing Your Cookies">
            <p className="text-gray-600 leading-7">
              You can control or delete cookies through your browser settings.
              Most browsers let you block or remove cookies and notify you when a
              cookie is set. Please note that disabling essential cookies may
              prevent parts of the platform — including sign-in and booking — from
              working correctly.
            </p>
          </Section>

          <Section index={6} title="Updates to This Policy">
            <p className="text-gray-600 leading-7">
              We may update this Cookie Policy from time to time. When we do, we
              will revise the effective date above and post the updated version on
              this page.
            </p>
          </Section>

          <Section index={7} title="Contact Us">
            <p className="text-gray-600 leading-7">
              If you have questions about our use of cookies, contact our support
              team:
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
