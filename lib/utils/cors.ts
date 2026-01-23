type CorsConfig = {
  allowCredentials: boolean;
};

const LOOPBACK_ORIGIN_PREFIXES = ["http://127.0.0.1:", "http://localhost:"];

function getEnvOriginList(): string[] {
  const raw = process.env.CORS_ALLOW_ORIGINS;
  if (!raw) return [];
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function getDefaultOrigins(): string[] {
  const candidates = [
    process.env.NEXTAUTH_URL,
    process.env.AUTH_URL,
    process.env.NEXT_PUBLIC_APP_ORIGIN,
  ]
    .filter(Boolean)
    .map((value) => {
      try {
        return new URL(value as string).origin;
      } catch {
        return value as string;
      }
    });
  return Array.from(new Set(candidates));
}

function isLoopbackOrigin(origin: string): boolean {
  return LOOPBACK_ORIGIN_PREFIXES.some((prefix) => origin.startsWith(prefix));
}

function isTauriOrigin(origin: string): boolean {
  return origin.startsWith("tauri://");
}

export function isAllowedCorsOrigin(origin: string | null): boolean {
  if (!origin) return true;
  if (origin === "null") return true;
  if (isLoopbackOrigin(origin) || isTauriOrigin(origin)) return true;

  const allowed = [...getEnvOriginList(), ...getDefaultOrigins()];
  return allowed.includes(origin);
}

export function buildCorsHeaders(origin: string | null, config?: CorsConfig): Headers {
  const headers = new Headers();
  if (origin) {
    headers.set("Access-Control-Allow-Origin", origin);
  } else {
    headers.set("Access-Control-Allow-Origin", "null");
  }
  headers.set(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-requested-with"
  );
  if (config?.allowCredentials && origin) {
    headers.set("Access-Control-Allow-Credentials", "true");
  }
  return headers;
}
