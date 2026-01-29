"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { OtpInput } from "@/components/ui/otp-input";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Auto-submit when code is complete
  useEffect(() => {
    if (code.length === 6) {
      void handleVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const handleVerify = async () => {
    if (code.length !== 6) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "CODE_EXPIRED") {
          setError("Code expiré. Veuillez en demander un nouveau.");
        } else {
          setError(data.error || "Code invalide");
        }
        setCode("");
      } else {
        router.push("/login?verified=true");
      }
    } catch (err) {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setResendLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setResendCooldown(60);
        setCode("");
      } else {
        const data = await res.json();
        setError(data.error || "Une erreur est survenue");
      }
    } catch (err) {
      setError("Une erreur est survenue");
    } finally {
      setResendLoading(false);
    }
  };

  if (!email) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md space-y-6 p-8 text-center"
      >
        <h1 className="text-2xl font-semibold text-foreground">Email requis</h1>
        <p className="text-muted-foreground">
          Veuillez vous inscrire pour recevoir un code de vérification.
        </p>
        <Link href="/login">
          <Button className="w-full">Retour à la connexion</Button>
        </Link>
      </motion.div>
    );
  }

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
        Retour à la connexion
      </Link>

      {/* Header */}
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Vérifiez votre email
          </h1>
          <p className="mt-2 text-muted-foreground">
            Nous avons envoyé un code à 6 chiffres à
          </p>
          <p className="font-medium text-foreground">{email}</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
          {error}
        </div>
      )}

      {/* OTP Input */}
      <div className="space-y-4">
        <OtpInput
          value={code}
          onChange={setCode}
          disabled={loading}
        />

        <Button
          onClick={handleVerify}
          disabled={loading || code.length !== 6}
          className="w-full"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Vérifier"
          )}
        </Button>
      </div>

      {/* Resend */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Vous n&apos;avez pas reçu le code ?
        </p>
        <button
          onClick={handleResend}
          disabled={resendLoading || resendCooldown > 0}
          className="mt-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resendLoading ? (
            <span className="inline-flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Envoi...
            </span>
          ) : resendCooldown > 0 ? (
            `Renvoyer dans ${resendCooldown}s`
          ) : (
            "Renvoyer le code"
          )}
        </button>
      </div>
    </motion.div>
  );
}

export default function VerifyEmailPage() {
  return <VerifyEmailContent />;
}
