import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - MiniOrg",
  description: "Terms and conditions for using MiniOrg.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen py-24 px-6">
      <article className="mx-auto max-w-2xl">
        <header className="mb-16">
          <p className="text-sm font-medium text-primary mb-3">Legal</p>
          <h1 className="font-display text-4xl font-semibold text-foreground md:text-5xl">
            Terms of Service
          </h1>
          <p className="mt-4 text-muted">Last updated: January 31, 2026</p>
        </header>

        <div className="prose prose-gray max-w-none space-y-12">
          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-4">
              Agreement to Terms
            </h2>
            <p className="text-muted leading-relaxed">
              By accessing or using MiniOrg, you agree to be bound by these
              Terms of Service. If you do not agree to these terms, please do
              not use our service.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-4">
              Description of Service
            </h2>
            <p className="text-muted leading-relaxed">
              MiniOrg is a personal productivity application that helps you
              organize tasks, plan your day, and integrate with calendar
              services. We reserve the right to modify, suspend, or discontinue
              the service at any time.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-4">
              User Accounts
            </h2>
            <p className="text-muted leading-relaxed mb-4">
              When you create an account, you agree to:
            </p>
            <ul className="space-y-2 text-muted">
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>Provide accurate and complete information</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>Maintain the security of your account credentials</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>
                  Accept responsibility for all activities under your account
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>Notify us immediately of any unauthorized access</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-4">
              Acceptable Use
            </h2>
            <p className="text-muted leading-relaxed mb-4">
              You agree not to use MiniOrg to:
            </p>
            <ul className="space-y-2 text-muted">
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>Violate any applicable laws or regulations</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>Infringe on the rights of others</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>
                  Attempt to gain unauthorized access to our systems
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>Transmit malicious code or interfere with the service</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-4">
              Intellectual Property
            </h2>
            <p className="text-muted leading-relaxed">
              The MiniOrg service, including its original content, features, and
              functionality, is owned by MiniOrg and protected by international
              copyright, trademark, and other intellectual property laws. You
              retain ownership of all data you create within the application.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-4">
              Limitation of Liability
            </h2>
            <p className="text-muted leading-relaxed">
              MiniOrg shall not be liable for any indirect, incidental, special,
              consequential, or punitive damages resulting from your use or
              inability to use the service. Our total liability shall not exceed
              the amount you paid us in the twelve months prior to the claim.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-4">
              Termination
            </h2>
            <p className="text-muted leading-relaxed">
              We may terminate or suspend your account at any time for any
              reason, including violation of these terms. Upon termination, your
              right to use the service will immediately cease. You may also
              delete your account at any time through the application settings.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-4">
              Changes to Terms
            </h2>
            <p className="text-muted leading-relaxed">
              We reserve the right to modify these terms at any time. We will
              notify you of any changes by posting the new terms on this page
              and updating the &quot;Last updated&quot; date. Your continued use of the
              service after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-4">
              Contact Us
            </h2>
            <p className="text-muted leading-relaxed">
              If you have any questions about these Terms of Service, please
              contact us at{" "}
              <a
                href="mailto:legal@miniorg.app"
                className="text-primary hover:underline"
              >
                legal@miniorg.app
              </a>
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
