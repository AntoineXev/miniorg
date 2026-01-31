import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - MiniOrg",
  description: "How we handle and protect your data at MiniOrg.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen py-24 px-6">
      <article className="mx-auto max-w-2xl">
        <header className="mb-16">
          <p className="text-sm font-medium text-primary mb-3">Legal</p>
          <h1 className="font-display text-4xl font-semibold text-foreground md:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-4 text-muted">Last updated: January 31, 2026</p>
        </header>

        <div className="prose prose-gray max-w-none space-y-12">
          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-4">
              Introduction
            </h2>
            <p className="text-muted leading-relaxed">
              At MiniOrg, we take your privacy seriously. This Privacy Policy
              explains how we collect, use, disclose, and safeguard your
              information when you use our application and website.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-4">
              Information We Collect
            </h2>
            <p className="text-muted leading-relaxed mb-4">
              We collect information that you provide directly to us:
            </p>
            <ul className="space-y-2 text-muted">
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>
                  Account information (email address, name) when you sign up
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>
                  Task and calendar data you create within the application
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>
                  Usage data and analytics to improve our service
                </span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-4">
              How We Use Your Information
            </h2>
            <p className="text-muted leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            <ul className="space-y-2 text-muted">
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>Provide, maintain, and improve our services</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>Send you updates and marketing communications</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>Respond to your comments and questions</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>Protect against fraudulent or illegal activity</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-4">
              Data Security
            </h2>
            <p className="text-muted leading-relaxed">
              We implement appropriate technical and organizational measures to
              protect your personal information against unauthorized access,
              alteration, disclosure, or destruction. Your data is encrypted
              both in transit and at rest.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-4">
              Third-Party Services
            </h2>
            <p className="text-muted leading-relaxed">
              We may use third-party services such as Google Calendar for
              calendar synchronization. These services have their own privacy
              policies, and we encourage you to review them. We only share the
              minimum data necessary for these integrations to function.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-4">
              Your Rights
            </h2>
            <p className="text-muted leading-relaxed mb-4">You have the right to:</p>
            <ul className="space-y-2 text-muted">
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>Access and receive a copy of your personal data</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>Request correction of inaccurate data</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>Request deletion of your data</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>Withdraw consent at any time</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-4">
              Contact Us
            </h2>
            <p className="text-muted leading-relaxed">
              If you have any questions about this Privacy Policy, please
              contact us at{" "}
              <a
                href="mailto:privacy@miniorg.app"
                className="text-primary hover:underline"
              >
                privacy@miniorg.app
              </a>
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
