"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, KeyRound, AlertCircle } from "lucide-react";
import Link from "next/link";

function ForgotPasswordContent() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        router.push(`/reset-password?email=${encodeURIComponent(email)}`);
      } else {
        const data = await res.json();
        setError(data.error || "Une erreur est survenue");
      }
    } catch (err) {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md space-y-6 p-8"
    >
      {/* Back Link */}
      <Link
        href="/login"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
      </Link>

      {/* Header */}
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center">
          <KeyRound strokeWidth={1} className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Mot de passe oublié
          </h1>
          <p className="mt-2 text-muted-foreground">
            Entrez votre email pour recevoir un code de réinitialisation.
          </p>
        </div>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-destructive/5 border-l-2 border-destructive">
              <AlertCircle strokeWidth={1.5} className="h-5 w-5 text-destructive shrink-0" />
              <p className="text-sm text-destructive/90">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />

        <Button
          type="submit"
          disabled={loading || !email}
          className="w-full"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Envoyer le code"
          )}
        </Button>
      </form>
    </motion.div>
  );
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordContent />;
}
