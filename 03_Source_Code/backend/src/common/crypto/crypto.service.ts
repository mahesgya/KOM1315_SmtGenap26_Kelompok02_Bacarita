import { Injectable } from '@nestjs/common';
import { createHash, createHmac, timingSafeEqual } from 'crypto';

@Injectable()
export class CryptoService {
  /**
   * Compute SHA-256 hex digest of a token string.
   */
  public hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Compute HMAC-SHA256 hex signature of data using the provided secret.
   */
  public signResult(data: string, secret: string): string {
    return createHmac('sha256', secret).update(data).digest('hex');
  }

  /**
   * Verify an HMAC-SHA256 signature using constant-time comparison.
   */
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
}
