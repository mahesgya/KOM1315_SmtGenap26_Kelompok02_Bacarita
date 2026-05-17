import { Injectable } from '@nestjs/common';
import {
  createSign,
  createVerify,
  generateKeyPairSync,
  KeyPairSyncResult,
} from 'crypto';

@Injectable()
export class AsymmetricSignatureService {
  private readonly privateKey: string;
  private readonly publicKey: string;

  constructor() {
    // Use env-provided PEM keys in production; generate an ephemeral pair otherwise.
    const envPrivate = process.env.RSA_PRIVATE_KEY;
    const envPublic = process.env.RSA_PUBLIC_KEY;

    if (envPrivate && envPublic) {
      this.privateKey = envPrivate.replace(/\\n/g, '\n');
      this.publicKey = envPublic.replace(/\\n/g, '\n');
    } else {
      const pair: KeyPairSyncResult<string, string> = generateKeyPairSync(
        'rsa',
        {
          modulusLength: 2048,
          publicKeyEncoding: { type: 'spki', format: 'pem' },
          privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        },
      );
      this.privateKey = pair.privateKey;
      this.publicKey = pair.publicKey;
    }
  }

  /**
   * Sign arbitrary data with the RSA-SHA256 private key.
   * Returns a base64-encoded DER signature.
   */
  public sign(data: string): string {
    const signer = createSign('RSA-SHA256');
    signer.update(data, 'utf8');
    signer.end();
    return signer.sign(this.privateKey, 'base64');
  }

  /**
   * Verify an RSA-SHA256 signature against the public key.
   */
  public verify(data: string, signature: string): boolean {
    try {
      const verifier = createVerify('RSA-SHA256');
      verifier.update(data, 'utf8');
      verifier.end();
      return verifier.verify(this.publicKey, signature, 'base64');
    } catch {
      return false;
    }
  }

  public getPublicKeyPem(): string {
    return this.publicKey;
  }
}
