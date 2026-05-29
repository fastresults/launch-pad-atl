import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/Footer";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Startup Labs" },
      {
        name: "description",
        content:
          "The terms and conditions governing your use of the Startup Labs website, workshops, and services.",
      },
      { property: "og:title", content: "Terms of Service — Startup Labs" },
      {
        property: "og:description",
        content:
          "The terms and conditions governing your use of the Startup Labs website, workshops, and services.",
      },
      { property: "og:url", content: "https://startuplabs.online/terms" },
    ],
    links: [{ rel: "canonical", href: "https://startuplabs.online/terms" }],
  }),
  component: TermsPage,
});

const UPDATED = "May 29, 2026";

function TermsPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Legal
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
          Terms of Service
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated: {UPDATED}</p>

        <div className="prose prose-invert mt-10 max-w-none space-y-8 text-foreground/90">
          <section>
            <p>
              Startup Labs ("Startup Labs," "we," "us," or "our"), a division of
              Evolve Inc., operates startuplabs.online and the in-person workshop
              experience held in Norcross, Georgia, and metropolitan areas across the Southeast United States. By accessing our website, registering for a workshop, or using any of our services, you agree to these Terms of Service. If you do not agree, please do not use our services.
            </p>
          </section>

          <Section title="1. Acceptance of Terms">
            <p>
              These Terms of Service ("Terms") constitute a legally binding agreement between you and Startup Labs. They govern your access to and use of our website, workshops, and any related services (collectively, the "Services"). Your continued use of the Services after we post changes to these Terms constitutes your acceptance of the revised Terms.
            </p>
          </Section>

          <Section title="2. Services Provided">
            <p>Startup Labs provides the following services:</p>
            <ul>
              <li>
                <strong>In-person workshops:</strong> intensive one-day sessions designed to help participants start a business in a single day.
              </li>
              <li>
                <strong>Online registration &amp; dashboard:</strong> a platform for signing up, managing registrations, submitting business ideas, and accessing workshop materials.
              </li>
              <li>
                <strong>Consulting &amp; guidance:</strong> business coaching, feedback, and support provided during and after workshops.
              </li>
              <li>
                <strong>Digital content:</strong> templates, guides, and resources made available to registered participants.
              </li>
            </ul>
            <p>
              We reserve the right to modify, suspend, or discontinue any aspect of the Services at any time, with or without notice.
            </p>
          </Section>

          <Section title="3. Client Responsibilities">
            <p>By using our Services, you agree to:</p>
            <ul>
              <li>Provide accurate, current, and complete information when registering.</li>
              <li>Maintain the confidentiality of your account credentials.</li>
              <li>Notify us immediately of any unauthorized use of your account.</li>
              <li>Submit timely feedback, materials, and responses requested for workshop participation.</li>
              <li>Use the Services lawfully and in good faith, without infringing on the rights of others.</li>
              <li>Respect other participants, instructors, and staff during workshops and online interactions.</li>
            </ul>
          </Section>

          <Section title="4. Payments &amp; Refunds">
            <ul>
              <li>
                <strong>Fees:</strong> workshop and service fees are listed at checkout and must be paid in full before participation.
              </li>
              <li>
                <strong>Payment processing:</strong> payments are processed by our third-party payment processor. We do not store full card numbers.
              </li>
              <li>
                <strong>Refund policy:</strong> refunds are available up to 7 days before the scheduled workshop date. Cancellations within 7 days are non-refundable but may be credited toward a future workshop at our discretion.
              </li>
              <li>
                <strong>No-shows:</strong> failure to attend a workshop without prior notice does not entitle you to a refund or credit.
              </li>
            </ul>
          </Section>

          <Section title="5. Intellectual Property">
            <ul>
              <li>
                <strong>Our content:</strong> all materials, branding, curriculum, templates, and content provided by Startup Labs remain our intellectual property. You are granted a limited, non-exclusive license to use workshop materials for personal, non-commercial use.
              </li>
              <li>
                <strong>Your content:</strong> any business ideas, notes, or materials you submit remain your property. By submitting them, you grant us a license to review, provide feedback on, and use them solely for the purpose of delivering the Services.
              </li>
              <li>
                <strong>Restrictions:</strong> you may not reproduce, distribute, modify, or create derivative works from our materials without prior written consent.
              </li>
            </ul>
          </Section>

          <Section title="6. Confidentiality">
            <p>
              Participants may share business ideas, strategies, and personal information during workshops. You agree to maintain the confidentiality of other participants' information and not disclose or use it outside the workshop context without permission.
            </p>
          </Section>

          <Section title="7. Disclaimers">
            <ul>
              <li>
                <strong>No guarantee of success:</strong> Startup Labs provides education, tools, and guidance. We do not guarantee that you will launch a successful business or achieve any specific outcome.
              </li>
              <li>
                <strong>Workshop nature:</strong> workshops are intensive educational experiences. Results depend on your effort, market conditions, and other factors beyond our control.
              </li>
              <li>
                <strong>Third-party services:</strong> we are not responsible for the actions, content, or policies of third-party services (payment processors, hosting providers, Google authentication, etc.).
              </li>
              <li>
                <strong>"As is":</strong> the Services are provided "as is" and "as available" without warranties of any kind, either express or implied.
              </li>
            </ul>
          </Section>

          <Section title="8. Limitation of Liability">
            <p>
              To the maximum extent permitted by law, Startup Labs and its affiliates, officers, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, arising out of your access to or use of (or inability to access or use) the Services.
            </p>
            <p>
              Our total liability for any claim arising out of or relating to these Terms or the Services shall not exceed the amount you paid to us in the 12 months preceding the claim.
            </p>
          </Section>

          <Section title="9. Indemnification">
            <p>
              You agree to indemnify, defend, and hold harmless Startup Labs, Evolve Inc., and their respective officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses (including reasonable attorneys' fees) arising out of or in any way connected with your access to or use of the Services, your violation of these Terms, or your infringement of any intellectual property or other rights of any person or entity.
            </p>
          </Section>

          <Section title="10. Termination">
            <p>
              We may suspend or terminate your access to the Services at any time, with or without cause, and with or without notice. Upon termination, all licenses and rights granted to you under these Terms will immediately cease. Provisions that by their nature should survive termination shall survive, including intellectual property, disclaimers, limitation of liability, and indemnification.
            </p>
          </Section>

          <Section title="11. Governing Law">
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the State of Georgia, United States, without regard to its conflict-of-law principles. Any disputes arising under these Terms shall be resolved exclusively in the state or federal courts located in Gwinnett County, Georgia.
            </p>
          </Section>

          <Section title="12. Changes to Terms">
            <p>
              We may update these Terms from time to time. Material changes will be posted on this page with a new "Last updated" date. Your continued use of the Services after changes constitutes acceptance of the revised Terms.
            </p>
          </Section>

          <Section title="13. Contact">
            <p>
              Questions about these Terms? Email{" "}
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
