"use client";

import { signIn } from "next-auth/react";
import { Suspense, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { isTauri } from "@/lib/platform";
import { useTauriSession } from "@/providers/tauri-session";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

type AuthMode = "signin" | "signup";

function LoginContent() {
  const { login, loginWithCredentials, signup, status } = useTauriSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const toastShown = useRef(false);

  // Show toast for success messages from query params
  useEffect(() => {
    if (toastShown.current) return;

    if (searchParams.get("verified") === "true") {
      toastShown.current = true;
      toast.success("Email vérifié ! Vous pouvez maintenant vous connecter.");
    }
    if (searchParams.get("reset") === "true") {
      toastShown.current = true;
      toast.success("Mot de passe réinitialisé ! Vous pouvez maintenant vous connecter.");
    }
  }, [searchParams]);

  // If already authenticated (Tauri JWT), skip login page
  useEffect(() => {
    if (status === "authenticated" && isTauri()) {
      router.replace("/onboarding");
    }
  }, [status, router]);

  const handleGoogleLogin = () => {
    if (isTauri()) {
      void login();
    } else {
      signIn("google", { callbackUrl: "/backlog" });
    }
  };

  const validatePassword = (pwd: string): string[] => {
    const errors: string[] = [];
    if (pwd.length < 8) errors.push("8 caractères minimum");
    if (!/[A-Z]/.test(pwd)) errors.push("1 majuscule");
    if (!/[a-z]/.test(pwd)) errors.push("1 minuscule");
    if (!/[0-9]/.test(pwd)) errors.push("1 chiffre");
    if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(pwd)) errors.push("1 caractère spécial");
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === "signup") {
      // Validate name
      if (!name.trim()) {
        setError("Le nom est requis");
        return;
      }

      // Validate password
      const passwordErrors = validatePassword(password);
      if (passwordErrors.length > 0) {
        setError(`Le mot de passe doit contenir: ${passwordErrors.join(", ")}`);
        return;
      }

      if (password !== confirmPassword) {
        setError("Les mots de passe ne correspondent pas");
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        // Signup flow
        if (isTauri()) {
          const result = await signup(email, password, name);
          if (!result.success) {
            setError(result.error || "Une erreur est survenue");
          } else {
            router.push(`/verify-email?email=${encodeURIComponent(email)}`);
          }
        } else {
          const res = await fetch("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, name }),
          });

          const data = await res.json();

          if (!res.ok) {
            if (data.code === "USE_GOOGLE") {
              setError("Cet email est associé à un compte Google. Veuillez vous connecter avec Google.");
            } else {
              setError(data.error || "Une erreur est survenue");
            }
          } else {
            router.push(`/verify-email?email=${encodeURIComponent(email)}`);
          }
        }
      } else {
        // Signin flow
        if (isTauri()) {
          const result = await loginWithCredentials(email, password);
          if (!result.success) {
            if (result.code === "EMAIL_NOT_VERIFIED") {
              router.push(`/verify-email?email=${encodeURIComponent(email)}`);
            } else if (result.code === "USE_GOOGLE") {
              setError("Cet email est associé à un compte Google. Veuillez vous connecter avec Google.");
            } else {
              setError(result.error || "Email ou mot de passe incorrect");
            }
          }
        } else {
          const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
          });

          if (result?.error) {
            if (result.error === "EMAIL_NOT_VERIFIED") {
              router.push(`/verify-email?email=${encodeURIComponent(email)}`);
            } else if (result.error === "USE_GOOGLE") {
              setError("Cet email est associé à un compte Google. Veuillez vous connecter avec Google.");
            } else {
              setError("Email ou mot de passe incorrect");
            }
          } else if (result?.ok) {
            router.push("/backlog");
          }
        }
      }
    } catch (err: any) {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const passwordErrors = mode === "signup" ? validatePassword(password) : [];
  const passwordValid = passwordErrors.length === 0 && password.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md space-y-6 p-8"
    >
      <div className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">
          MiniOrg
        </h1>
        <p className="mt-2 text-muted-foreground">
          Your minimal life planner
        </p>
      </div>

      {/* Tabs */}
      <div className="flex rounded-lg bg-secondary p-1">
        <button
          type="button"
          onClick={() => {
            setMode("signin");
            setError(null);
          }}
          className={`flex-1 py-1 px-4 rounded-md text-sm font-medium transition-colors ${
            mode === "signin"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Connexion
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("signup");
            setError(null);
          }}
          className={`flex-1 py-1 px-4 rounded-md text-sm font-medium transition-colors ${
            mode === "signup"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Inscription
        </button>
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
            <div className="flex items-center gap-3 px-4 py-3 rounded-md bg-destructive/5 border-destructive">
              <AlertCircle strokeWidth={1.5} className="h-5 w-5 text-destructive shrink-0" />
              <p className="text-sm text-destructive/90">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Credentials Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name (signup only) */}
        {mode === "signup" && (
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Nom complet"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>
        )}

        <div className="space-y-2">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Mot de passe"
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

          {/* Password Requirements (signup only) */}
          {mode === "signup" && password.length > 0 && (
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

        {/* Confirm Password (signup only) */}
        {mode === "signup" && (
          <div className="space-y-2">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Confirmer le mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                className="pr-10"
              />
            </div>
            {confirmPassword.length > 0 && password !== confirmPassword && (
              <p className="text-xs text-destructive">Les mots de passe ne correspondent pas</p>
            )}
          </div>
        )}

        {/* Forgot Password Link (signin only) */}
        {mode === "signin" && (
          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Mot de passe oublié ?
            </Link>
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : mode === "signin" ? (
            "Se connecter"
          ) : (
            "Créer un compte"
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">ou</span>
        </div>
      </div>

      {/* Google OAuth */}
      <Button
        variant="outline"
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 bg-white border border-border rounded-lg hover:bg-secondary transition-colors duration-200 font-medium text-foreground shadow-sm disabled:opacity-50"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continuer avec Google
      </Button>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
