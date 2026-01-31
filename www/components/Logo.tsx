import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="font-display text-xl font-semibold text-foreground">
      Mini<span className="text-primary">Org</span>.
    </Link>
  );
}
