"use client";

import { useState } from "react";

export default function ContactPage() {
  const [formState, setFormState] = useState<"idle" | "loading" | "success">(
    "idle"
  );
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState("loading");

    // TODO: Add email sending or form backend
    await new Promise((resolve) => setTimeout(resolve, 500));

    setFormState("success");
  };

  if (formState === "success") {
    return (
      <main className="min-h-screen py-24 px-6">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-light">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                className="text-green"
              >
                <path
                  d="M7 13l3 3 7-7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <h1 className="font-display text-3xl font-semibold text-foreground">
            Message sent!
          </h1>
          <p className="mt-4 text-muted">
            Thanks for reaching out. We&apos;ll get back to you as soon as possible.
          </p>
          <button
            onClick={() => {
              setFormState("idle");
              setFormData({ name: "", email: "", subject: "", message: "" });
            }}
            className="mt-8 text-sm text-primary hover:underline"
          >
            Send another message
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-24 px-6">
      <div className="mx-auto max-w-2xl">
        <header className="mb-16">
          <p className="text-sm font-medium text-primary mb-3">Get in touch</p>
          <h1 className="font-display text-4xl font-semibold text-foreground md:text-5xl">
            Contact Us
          </h1>
          <p className="mt-4 text-muted max-w-lg">
            Have a question, feedback, or just want to say hi? We&apos;d love to hear
            from you. Fill out the form below and we&apos;ll get back to you soon.
          </p>
        </header>

        <div className="grid gap-12 lg:grid-cols-5">
          <form onSubmit={handleSubmit} className="space-y-6 lg:col-span-3">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="subject"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Subject
              </label>
              <input
                type="text"
                id="subject"
                required
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                placeholder="How can we help?"
              />
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Message
              </label>
              <textarea
                id="message"
                required
                rows={5}
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none"
                placeholder="Tell us more..."
              />
            </div>

            <button
              type="submit"
              disabled={formState === "loading"}
              className="rounded-lg bg-primary px-6 py-3 font-display font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              {formState === "loading" ? "Sending..." : "Send message"}
            </button>
          </form>

          <div className="space-y-8 lg:col-span-2">
            <div>
              <h3 className="font-display font-semibold text-foreground mb-2">
                Email
              </h3>
              <a
                href="mailto:hello@miniorg.app"
                className="text-muted hover:text-primary transition-colors"
              >
                hello@miniorg.app
              </a>
            </div>

            <div>
              <h3 className="font-display font-semibold text-foreground mb-2">
                Social
              </h3>
              <div className="flex gap-4">
                <a
                  href="https://twitter.com/miniorgapp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted hover:text-primary transition-colors"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
              </div>
            </div>

            <div className="rounded-xl bg-secondary p-6">
              <h3 className="font-display font-semibold text-foreground mb-2">
                Response time
              </h3>
              <p className="text-sm text-muted">
                We typically respond within 24-48 hours during business days.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
