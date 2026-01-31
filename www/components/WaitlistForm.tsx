"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface WaitlistFormProps {
  compact?: boolean;
}

export function WaitlistForm({ compact = false }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        throw new Error("Failed to join waitlist");
      }

      router.push("/success");
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  const inputClasses = compact
    ? "w-40 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
    : "w-48 bg-transparent text-base text-foreground placeholder:text-muted-foreground outline-none md:w-64";

  const containerClasses = compact
    ? "flex items-center rounded-full bg-secondary pl-4 pr-1 py-1"
    : "flex items-center rounded-full bg-secondary pl-6 pr-1.5 py-1.5";

  const buttonClasses = compact
    ? "ml-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
    : "ml-3 rounded-full bg-primary px-6 py-3 font-display font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50";

  const buttonText = compact
    ? isLoading ? "..." : "Join"
    : isLoading ? "Joining..." : "Join waitlist";

  return (
    <div className={compact ? "" : "flex flex-col items-center"}>
      <form onSubmit={handleSubmit} className={compact ? "flex items-center" : "flex items-center justify-center"}>
        <div className={containerClasses}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@email.com"
            required
            className={inputClasses}
          />
          <button
            type="submit"
            disabled={isLoading}
            className={buttonClasses}
          >
            {buttonText}
          </button>
        </div>
      </form>
      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
