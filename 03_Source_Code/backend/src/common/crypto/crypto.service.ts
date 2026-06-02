import { Injectable } from '@nestjs/common';
import { createHash, createHmac, timingSafeEqual } from 'crypto';
import { aesEncrypt, aesDecrypt } from './aes.transformer';

@Injectable()
export class CryptoService {
  public hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  public signResult(data: string, secret: string): string {
    return createHmac('sha256', secret).update(data).digest('hex');
  }

  public verifySignature(
    data: string,
    signature: string,
    secret: string,
  ): boolean {
    const expected: string = this.signResult(data, secret);
    try {
      return timingSafeEqual(
        Buffer.from(expected, 'hex'),
        Buffer.from(signature, 'hex'),
      );
    } catch {
      return false;
    }
  }

  /** AES-256-CBC encrypt. Returns `ivHex:ciphertextHex`. */
  public encrypt(plaintext: string): string {
    return aesEncrypt(plaintext);
  }

  /** AES-256-CBC decrypt. Accepts `ivHex:ciphertextHex`. */
  public decrypt(ciphertext: string): string {
    return aesDecrypt(ciphertext);
  }
}
