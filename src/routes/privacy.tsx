import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/Footer";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Startup Labs" },
      {
        name: "description",
        content:
          "How Startup Labs collects, uses, and protects the personal information of workshop registrants and website visitors.",
      },
      { property: "og:title", content: "Privacy Policy — Startup Labs" },
      {
        property: "og:description",
        content:
          "How Startup Labs collects, uses, and protects the personal information of workshop registrants and website visitors.",
      },
      { property: "og:url", content: "https://startuplabs.online/privacy" },
    ],
    links: [{ rel: "canonical", href: "https://startuplabs.online/privacy" }],
  }),
  component: PrivacyPage,
});

const UPDATED = "May 29, 2026";

function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Legal
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated: {UPDATED}</p>

        <div className="prose prose-invert mt-10 max-w-none space-y-8 text-foreground/90">
          <section>
            <p>
              Startup Labs ("Startup Labs," "we," "us," or "our"), a division of
              Evolve Inc., operates startuplabs.online and the in-person workshop
              experience held in Norcross, Georgia, and metropolitan areas across the Southeast United States. This Privacy Policy explains what
              information we collect, how we use it, and the choices you have.
            </p>
          </section>

          <Section title="1. Information we collect">
            <p>We collect information you provide directly to us, including:</p>
            <ul>
              <li>
                <strong>Account &amp; registration:</strong> name, email address,
                phone number, and password (hashed) when you create an account or
                register for a workshop.
              </li>
              <li>
                <strong>Workshop intake:</strong> business idea details, goals,
                and any notes or files you submit through your dashboard.
              </li>
              <li>
                <strong>Payment information:</strong> processed by our
                third-party payment processor. We do not store full card numbers
                on our servers.
              </li>
              <li>
                <strong>Authentication data:</strong> if you sign in with Google,
                we receive your name, email, and profile image from Google.
              </li>
              <li>
                <strong>Automatically collected:</strong> IP address, browser
                type, device information, and basic usage analytics (pages
                visited, referring URL, timestamps).
              </li>
            </ul>
          </Section>

          <Section title="2. How we use information">
            <ul>
              <li>To create and manage your account.</li>
              <li>
                To process workshop registrations, payments, refunds, and
                attendance.
              </li>
              <li>
                To communicate with you about logistics, schedule changes, and
                post-workshop deliverables.
              </li>
              <li>To send occasional updates about future workshops (you can opt out).</li>
              <li>
                To improve the site, debug issues, and protect against fraud or
                abuse.
              </li>
              <li>To comply with legal obligations.</li>
            </ul>
          </Section>

          <Section title="3. How we share information">
            <p>
              We do not sell your personal information. We share it only with:
            </p>
            <ul>
              <li>
                <strong>Service providers</strong> that help us operate the
                business, including our hosting and database provider (Lovable
                Cloud / Supabase), our payment processor, our email provider,
                and Google for authentication.
              </li>
              <li>
                <strong>Legal authorities</strong> when required by law, court
                order, or to protect our rights and the safety of others.
              </li>
              <li>
                <strong>Business transfers</strong> in connection with a merger,
                acquisition, or sale of assets, in which case we will notify you.
              </li>
            </ul>
          </Section>

          <Section title="4. Data storage &amp; security">
            <p>
              Your data is stored on secured infrastructure provided by Lovable
              Cloud (Supabase) in the United States. We use industry-standard
              safeguards including encryption in transit (HTTPS), role-based
              access controls, and database row-level security. No system is
              perfectly secure; you use the service at your own risk.
            </p>
          </Section>

          <Section title="5. Cookies &amp; analytics">
            <p>
              We use a small number of cookies and local-storage entries to keep
              you signed in and to remember UI preferences (such as light/dark
              mode). We may use privacy-respecting analytics to understand site
              traffic in aggregate. You can disable cookies in your browser, but
              parts of the site may not work.
            </p>
          </Section>

          <Section title="6. Your rights &amp; choices">
            <ul>
              <li>
                <strong>Access &amp; correction:</strong> view and update your
                profile from your dashboard at any time.
              </li>
              <li>
                <strong>Deletion:</strong> request deletion of your account and
                associated data by emailing us (see Contact below).
              </li>
              <li>
                <strong>Marketing opt-out:</strong> use the unsubscribe link in
                any marketing email, or contact us directly.
              </li>
              <li>
                <strong>State-specific rights:</strong> residents of California
                and other states with applicable privacy laws may have
                additional rights (access, deletion, opt-out of sale — we do
                not sell data). Contact us to exercise these rights.
              </li>
            </ul>
          </Section>

          <Section title="7. Children">
            <p>
              The workshop and site are intended for adults (18+). We do not
              knowingly collect information from children under 13. If you
              believe a child has provided us information, contact us and we
              will delete it.
            </p>
          </Section>

          <Section title="8. Data retention">
            <p>
              We keep account and workshop records for as long as your account
              is active and for a reasonable period afterward to comply with
              tax, accounting, and legal obligations. You can request earlier
              deletion at any time.
            </p>
          </Section>

          <Section title="9. Changes to this policy">
            <p>
              We may update this Privacy Policy from time to time. Material
              changes will be announced on this page with a new "Last updated"
              date. Continued use of the site after changes constitutes
              acceptance of the revised policy.
            </p>
          </Section>

          <Section title="10. Contact">
            <p>
              Questions about this policy or your data? Email{" "}
              <a
                href="mailto:fastresults@gmail.com"
                className="text-primary underline-offset-4 hover:underline"
              >
                fastresults@gmail.com
              </a>
              .
            </p>
            <p className="text-sm text-muted-foreground">
              Startup Labs · Norcross, Georgia, and metropolitan areas across the Southeast United States · A division of Evolve Inc.
            </p>
          </Section>
        </div>

        <div className="mt-12">
          <Link
            to="/"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            ← Back to home
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      <div className="space-y-3 text-foreground/85 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_a]:text-primary">
        {children}
      </div>
    </section>
  );
}
