import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border px-6 py-10 text-center">
      <div className="mb-4 flex items-center justify-center gap-6">
        <Link
          href="/privacy"
          className="text-sm text-muted hover:text-foreground transition-colors"
        >
          Privacy
        </Link>
        <Link
          href="/terms"
          className="text-sm text-muted hover:text-foreground transition-colors"
        >
          Terms
        </Link>
        <Link
          href="/contact"
          className="text-sm text-muted hover:text-foreground transition-colors"
        >
          Contact
        </Link>
      </div>
      <p className="text-sm text-muted-foreground">
        2026 MiniOrg. All rights reserved.
      </p>
    </footer>
  );
}
