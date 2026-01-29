"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { OtpInput } from "@/components/ui/otp-input";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, KeyRound, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

type Step = "code" | "password";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [step, setStep] = useState<Step>("code");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  const validatePassword = (pwd: string): string[] => {
    const errors: string[] = [];
    if (pwd.length < 8) errors.push("8 caractères minimum");
    if (!/[A-Z]/.test(pwd)) errors.push("1 majuscule");
    if (!/[a-z]/.test(pwd)) errors.push("1 minuscule");
    if (!/[0-9]/.test(pwd)) errors.push("1 chiffre");
    if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(pwd)) errors.push("1 caractère spécial");
    return errors;
  };

  const passwordErrors = validatePassword(password);
  const passwordValid = passwordErrors.length === 0 && password.length > 0;

  // Step 1: Verify code
  const handleVerifyCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (code.length !== 6) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/verify-reset-code", {
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
        // Code is valid, move to password step
        setStep("password");
      }
    } catch (err) {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordValid) {
      setError(`Le mot de passe doit contenir: ${passwordErrors.join(", ")}`);
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "CODE_EXPIRED") {
          setError("Code expiré. Veuillez recommencer.");
          setStep("code");
          setCode("");
        } else if (data.code === "INVALID_CODE") {
          setError("Code invalide. Veuillez recommencer.");
          setStep("code");
          setCode("");
        } else {
          setError(data.error || "Une erreur est survenue");
        }
      } else {
        router.push("/login?reset=true");
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
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setResendCooldown(60);
        setCode("");
        setStep("code");
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
          Veuillez demander un code de réinitialisation.
        </p>
        <Link href="/forgot-password">
          <Button className="w-full">Demander un code</Button>
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
      </Link>

      {/* Header */}
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center">
          <KeyRound strokeWidth={1} className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {step === "code" ? "Vérifier le code" : "Nouveau mot de passe"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {step === "code"
              ? "Entrez le code à 6 chiffres reçu par email."
              : "Choisissez votre nouveau mot de passe."}
          </p>
          <p className="font-medium text-foreground">{email}</p>
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

      <AnimatePresence mode="wait">
        {step === "code" ? (
          <motion.div
            key="code-step"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Step 1: Code verification */}
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <OtpInput
                value={code}
                onChange={setCode}
                disabled={loading}
              />

              <Button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Vérifier le code"
                )}
              </Button>
            </form>

            {/* Resend */}
            <div className="text-center mt-6">
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
        ) : (
          <motion.div
            key="password-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Code verified badge */}
            <div className="flex items-center justify-center gap-2 mb-4 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              Code vérifié
            </div>

            {/* Step 2: New password */}
            <form onSubmit={handleResetPassword} className="space-y-4">
              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Nouveau mot de passe</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Nouveau mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Password Requirements */}
                {password.length > 0 && (
                  <div className="text-xs space-y-1 mt-2">
                    <div className={passwordValid ? "text-green-600" : "text-muted-foreground"}>
                      Le mot de passe doit contenir:
                    </div>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li className={password.length >= 8 ? "text-green-600" : "text-muted-foreground"}>
                        8 caractères minimum
                      </li>
                      <li className={/[A-Z]/.test(password) ? "text-green-600" : "text-muted-foreground"}>
                        1 majuscule
                      </li>
                      <li className={/[a-z]/.test(password) ? "text-green-600" : "text-muted-foreground"}>
                        1 minuscule
                      </li>
                      <li className={/[0-9]/.test(password) ? "text-green-600" : "text-muted-foreground"}>
                        1 chiffre
                      </li>
                      <li className={/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password) ? "text-green-600" : "text-muted-foreground"}>
                        1 caractère spécial
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Confirmer le mot de passe</label>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirmer le mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                {confirmPassword.length > 0 && password !== confirmPassword && (
                  <p className="text-xs text-destructive">Les mots de passe ne correspondent pas</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading || !passwordValid || password !== confirmPassword}
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Réinitialiser le mot de passe"
                )}
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  return <ResetPasswordContent />;
}
