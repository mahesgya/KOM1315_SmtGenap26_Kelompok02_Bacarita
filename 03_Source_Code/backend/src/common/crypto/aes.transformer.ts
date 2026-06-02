import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { ValueTransformer } from 'typeorm';

const ALGORITHM = 'aes-256-cbc';

function getKey(): Buffer {
  const hex = process.env.AES_SECRET_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error('AES_SECRET_KEY must be a 64-char hex string (32 bytes)');
  }
  return Buffer.from(hex, 'hex');
}

export function aesEncrypt(text: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
  ]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

export function aesDecrypt(stored: string): string {
  const [ivHex, encHex] = stored.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

export const AesTransformer: ValueTransformer = {
  to: (value: string | null | undefined): string | null => {
    if (value == null) return null;
    return aesEncrypt(value);
  },
  from: (value: string | null | undefined): string | null => {
    if (value == null) return null;
    try {
      return aesDecrypt(value);
    } catch {
      // Return as-is if decryption fails (e.g. legacy plaintext data)
      return value;
    }
  },
};
