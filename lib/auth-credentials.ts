/**
 * Password hashing using Web Crypto API (PBKDF2)
 * This is edge-runtime compatible and doesn't require external dependencies
 */

const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;
const ALGORITHM = "PBKDF2";

/**
 * Convert ArrayBuffer to base64 string
 */
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 string to ArrayBuffer
 */
function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Hash a password using PBKDF2
 * Format: pbkdf2$iterations$salt$hash
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    ALGORITHM,
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: ALGORITHM,
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    passwordKey,
    KEY_LENGTH * 8
  );

  const saltBase64 = bufferToBase64(salt.buffer);
  const hashBase64 = bufferToBase64(derivedBits);

  return `pbkdf2$${PBKDF2_ITERATIONS}$${saltBase64}$${hashBase64}`;
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  // Handle legacy bcrypt hashes (start with $2a$ or $2b$)
  if (storedHash.startsWith("$2")) {
    // For bcrypt hashes, we need to re-hash with PBKDF2
    // This should not happen in production after migration
    console.warn("Legacy bcrypt hash detected - please migrate user password");
    return false;
  }

  const parts = storedHash.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") {
    return false;
  }

  const iterations = parseInt(parts[1], 10);
  const salt = base64ToBuffer(parts[2]);
  const storedHashBuffer = base64ToBuffer(parts[3]);

  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    ALGORITHM,
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: ALGORITHM,
      salt: salt,
      iterations: iterations,
      hash: "SHA-256",
    },
    passwordKey,
    KEY_LENGTH * 8
  );

  // Constant-time comparison
  const derivedArray = new Uint8Array(derivedBits);
  const storedArray = new Uint8Array(storedHashBuffer);

  if (derivedArray.length !== storedArray.length) {
    return false;
  }

  let diff = 0;
  for (let i = 0; i < derivedArray.length; i++) {
    diff |= derivedArray[i] ^ storedArray[i];
  }

  return diff === 0;
}

/**
 * Validate password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character (!@#$%^&*()_+-=[]{}|;:,.<>?)
 */
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Le mot de passe doit contenir au moins 8 caractères");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins une majuscule");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins une minuscule");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins un chiffre");
  }

  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins un caractère spécial");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate a 6-digit verification code
 */
export function generateCode(): string {
  // Use crypto for secure random generation
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  // Get 6 digits, padded with zeros if needed
  return String(array[0] % 1000000).padStart(6, "0");
}

/**
 * Code expiry duration in minutes
 */
export const CODE_EXPIRY_MINUTES = 15;

/**
 * Get expiry date for a verification code
 */
export function getCodeExpiry(): Date {
  return new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);
}
