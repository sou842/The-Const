/**
 * src/lib/crypto.ts
 * AES-256-GCM message encryption layer.
 *
 * Security properties:
 * - AES-256 (256-bit key) — NIST-approved, used by signal protocol core
 * - GCM mode — authenticated encryption (detects tampering via authTag)
 * - Unique 12-byte IV per message — guarantees ciphertext uniqueness
 * - Key sourced from env variable — never hardcoded
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV per NIST recommendation for GCM

function getKey(): Buffer {
  const keyHex = process.env.MESSAGES_ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) {
    throw new Error(
      'MESSAGES_ENCRYPTION_KEY must be a 64-character hex string (32 bytes). Run: node -e "require(\'crypto\').randomBytes(32).toString(\'hex\')"'
    );
  }
  return Buffer.from(keyHex, 'hex');
}

export interface EncryptedPayload {
  ciphertext: string; // hex
  iv: string;         // hex
  authTag: string;    // hex
}

/**
 * Encrypt plaintext message content.
 * Each call produces a unique ciphertext even for identical inputs (random IV).
 */
export function encryptMessage(plaintext: string): EncryptedPayload {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  return {
    ciphertext: encrypted.toString('hex'),
    iv: iv.toString('hex'),
    authTag: cipher.getAuthTag().toString('hex'),
  };
}

/**
 * Decrypt a message payload. Throws if tampered (authTag mismatch).
 */
export function decryptMessage(payload: EncryptedPayload): string {
  const key = getKey();
  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(payload.iv, 'hex')
  );
  decipher.setAuthTag(Buffer.from(payload.authTag, 'hex'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, 'hex')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

/**
 * Sanitize user input — strip HTML tags to prevent XSS injection.
 * Applied before encryption, so the stored ciphertext can never contain scripts.
 */
export function sanitizeMessage(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')     // strip HTML tags
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // strip control chars
    .trim()
    .slice(0, 2000); // max message length
}
