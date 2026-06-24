import {
  TRIMMA_SUPPORT_EMAIL,
  TRIMMA_WHATSAPP_DISPLAY,
  TRIMMA_WHATSAPP_URL,
} from "@/lib/trimma-contact";

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
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#ffc800] text-sm font-bold text-zinc-900">
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
      <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ffc800]" />
      <span>{children}</span>
    </li>
  );
}

export default function DataDeletionPage() {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
        <header className="border-b border-zinc-100 pb-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#ffc800]/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-yellow-700">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ffc800]" />
            Data &amp; Privacy
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl">
            Data Deletion Request
          </h1>
          <p className="mt-4 max-w-3xl text-gray-600 leading-7">
            Trimma respects your right to control your personal data. This page
            explains how you can request the deletion of your data from Trimma,
            including data associated with accounts created or linked through
            social login providers such as Facebook and Google.
          </p>
          <p className="mt-4 text-sm font-semibold text-zinc-500">
            Effective date: <span className="text-zinc-900">{EFFECTIVE_DATE}</span>
          </p>
        </header>

        <div className="space-y-10 pt-10">
          <Section index={1} title="Overview">
            <p className="text-gray-600 leading-7">
              If you have used Trimma — including signing in with Facebook or
              Google — you may request that we delete the personal data we hold
              about you. We will process valid requests in line with applicable
              data-protection laws.
            </p>
          </Section>

          <Section index={2} title="How to Request Deletion">
            <p className="text-gray-600 leading-7">
              You can request deletion using either of the methods below:
            </p>

            <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-6">
              <p className="text-sm font-bold uppercase tracking-wider text-zinc-500">
                Method 1 — Email request (recommended)
              </p>
              <ol className="mt-3 space-y-2 text-gray-600 leading-7 list-decimal list-inside">
                <li>
                  Send an email to{" "}
                  <a
                    href={`mailto:${TRIMMA_SUPPORT_EMAIL}?subject=Data%20Deletion%20Request`}
                    className="font-bold text-zinc-900 underline decoration-[#ffc800] decoration-2 underline-offset-4 hover:text-yellow-700"
                  >
                    {TRIMMA_SUPPORT_EMAIL}
                  </a>{" "}
                  with the subject line <span className="font-semibold text-zinc-900">&quot;Data Deletion Request&quot;</span>.
                </li>
                <li>
                  Include the email address (and phone number, if any) associated
                  with your Trimma account so we can verify your identity.
                </li>
                <li>
                  We will confirm receipt and complete the deletion within the
                  timeframe noted below.
                </li>
              </ol>
            </div>

            <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-6">
              <p className="text-sm font-bold uppercase tracking-wider text-zinc-500">
                Method 2 — From your account
              </p>
              <ol className="mt-3 space-y-2 text-gray-600 leading-7 list-decimal list-inside">
                <li>Sign in to your Trimma account.</li>
                <li>Go to your Profile settings.</li>
                <li>Request account deletion, or contact support from within your account.</li>
              </ol>
            </div>
          </Section>

          <Section index={3} title="What Data Is Deleted">
            <p className="text-gray-600 leading-7">
              Upon a verified request, we delete or anonymize the personal data
              associated with your account, including:
            </p>
            <ul className="space-y-3">
              <Bullet>Your name, email address, and phone number.</Bullet>
              <Bullet>Profile information and social login connection data.</Bullet>
              <Bullet>Saved salons, styles, and preferences.</Bullet>
              <Bullet>Reviews and communications linked to your account.</Bullet>
            </ul>
          </Section>

          <Section index={4} title="What May Be Retained">
            <p className="text-gray-600 leading-7">
              Some information may be retained where required by law or for
              legitimate business purposes — for example, transaction and payment
              records needed for accounting, tax, or fraud-prevention obligations.
              Such records are kept only as long as necessary and are not used to
              re-identify you for marketing.
            </p>
          </Section>

          <Section index={5} title="Processing Time">
            <p className="text-gray-600 leading-7">
              We aim to acknowledge deletion requests within 7 days and complete
              verified deletions within 30 days. If we need more time or further
              verification, we will let you know.
            </p>
          </Section>

          <Section index={6} title="Contact Us">
            <p className="text-gray-600 leading-7">
              For any questions about deleting your data, contact our support
              team:
            </p>
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-6 space-y-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
                  Support Email
                </p>
                <a
                  href={`mailto:${TRIMMA_SUPPORT_EMAIL}?subject=Data%20Deletion%20Request`}
                  className="mt-1 inline-block text-lg font-bold text-zinc-900 underline decoration-[#ffc800] decoration-2 underline-offset-4 hover:text-yellow-700"
                >
                  {TRIMMA_SUPPORT_EMAIL}
                </a>
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
                  WhatsApp
                </p>
                <a
                  href={TRIMMA_WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-lg font-bold text-zinc-900 underline decoration-[#ffc800] decoration-2 underline-offset-4 hover:text-yellow-700"
                >
                  {TRIMMA_WHATSAPP_DISPLAY}
                </a>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
