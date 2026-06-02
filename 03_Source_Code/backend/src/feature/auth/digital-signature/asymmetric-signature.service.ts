import { Injectable, Logger } from '@nestjs/common';
import {
  createSign,
  createVerify,
  generateKeyPairSync,
  KeyPairSyncResult,
} from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const KEYS_DIR = path.resolve(process.cwd(), 'keys');
const PRIVATE_KEY_PATH = path.join(KEYS_DIR, 'rsa_private.pem');
const PUBLIC_KEY_PATH = path.join(KEYS_DIR, 'rsa_public.pem');

@Injectable()
export class AsymmetricSignatureService {
  private readonly logger = new Logger(AsymmetricSignatureService.name);
  private readonly privateKey: string;
  private readonly publicKey: string;

  constructor() {
    const envPrivate = process.env.RSA_PRIVATE_KEY;
    const envPublic = process.env.RSA_PUBLIC_KEY;

    if (envPrivate && envPublic) {
      this.privateKey = envPrivate.replace(/\\n/g, '\n');
      this.publicKey = envPublic.replace(/\\n/g, '\n');
      this.logger.log('RSA keys loaded from environment variables');
    } else {
      // Persist generated key pair so signatures survive server restarts
      const { privateKey, publicKey } = this.loadOrGenerateKeys();
      this.privateKey = privateKey;
      this.publicKey = publicKey;
    }
  }

  private loadOrGenerateKeys(): { privateKey: string; publicKey: string } {
    if (fs.existsSync(PRIVATE_KEY_PATH) && fs.existsSync(PUBLIC_KEY_PATH)) {
      this.logger.log(`RSA keys loaded from ${KEYS_DIR}`);
      return {
        privateKey: fs.readFileSync(PRIVATE_KEY_PATH, 'utf8'),
        publicKey: fs.readFileSync(PUBLIC_KEY_PATH, 'utf8'),
      };
    }

    this.logger.warn(
      'RSA keys not found — generating new 2048-bit key pair and persisting to ./keys/',
    );
    const pair: KeyPairSyncResult<string, string> = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    fs.mkdirSync(KEYS_DIR, { recursive: true });
    fs.writeFileSync(PRIVATE_KEY_PATH, pair.privateKey, { mode: 0o600 });
    fs.writeFileSync(PUBLIC_KEY_PATH, pair.publicKey, { mode: 0o644 });
    this.logger.log(`RSA key pair written to ${KEYS_DIR}`);

    return { privateKey: pair.privateKey, publicKey: pair.publicKey };
  }

  public sign(data: string): string {
    const signer = createSign('RSA-SHA256');
    signer.update(data, 'utf8');
    signer.end();
    return signer.sign(this.privateKey, 'base64');
  }

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
