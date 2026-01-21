import { jwtVerify, type JWTPayload } from "jose";

const DEFAULT_TAURI_JWT_ISSUER = "miniorg-tauri";
const DEFAULT_TAURI_JWT_AUDIENCE = "miniorg-tauri";
const DEFAULT_TAURI_STATE_AUDIENCE = "miniorg-tauri-oauth-state";

export function getTauriJwtSecret(): Uint8Array {
  const secret = process.env.TAURI_AUTH_SECRET;
  if (!secret) {
    throw new Error("Missing TAURI_AUTH_SECRET");
  }
  return new TextEncoder().encode(secret);
}

export function getTauriJwtIssuer(): string {
  return process.env.TAURI_JWT_ISSUER || DEFAULT_TAURI_JWT_ISSUER;
}

export function getTauriJwtAudience(): string {
  return process.env.TAURI_JWT_AUDIENCE || DEFAULT_TAURI_JWT_AUDIENCE;
}

export function getTauriStateAudience(): string {
  return process.env.TAURI_STATE_AUDIENCE || DEFAULT_TAURI_STATE_AUDIENCE;
}

export async function verifyTauriJwt(token: string): Promise<JWTPayload> {
  const secret = getTauriJwtSecret();
  const issuer = getTauriJwtIssuer();
  const audience = getTauriJwtAudience();
  const { payload } = await jwtVerify(token, secret, { issuer, audience });
  return payload;
}
