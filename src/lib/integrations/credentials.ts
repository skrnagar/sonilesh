import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const KEY_ENV = "INTEGRATION_ENCRYPTION_KEY";

function deriveKey() {
  const secret = process.env[KEY_ENV];
  if (!secret || secret.length < 16) return null;
  return scryptSync(secret, "ehs360-integration-credentials", 32);
}

export function credentialsKeyConfigured() {
  return Boolean(deriveKey());
}

export function secretRefFor(organizationId: string, connectionId: string) {
  return `secret:org/${organizationId}/connection/${connectionId}`;
}

/** Encrypts a secret for storage. Never send the result to the browser. */
export function encryptSecret(plaintext: string) {
  const key = deriveKey();
  if (!key) {
    throw new Error("INTEGRATION_ENCRYPTION_KEY is not configured");
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptSecret(payload: string) {
  const key = deriveKey();
  if (!key) {
    throw new Error("INTEGRATION_ENCRYPTION_KEY is not configured");
  }
  const buf = Buffer.from(payload, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

export function redactCredentialRow<T extends Record<string, unknown>>(row: T) {
  const { encrypted_payload: _payload, encrypted_secret: _secret, key_hash: _hash, ...safe } = row;
  void _payload;
  void _secret;
  void _hash;
  return {
    ...safe,
    hasSecret: Boolean(_payload || _secret || row.secret_ref),
  };
}
