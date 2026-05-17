import { Injectable } from '@nestjs/common';
import { randomBytes, randomInt } from 'crypto';
import { v7 as uuidv7 } from 'uuid';

@Injectable()
export class TokenGeneratorService {
  public randomUUIDV7(): string {
    return uuidv7();
  }

  public randomHex(length = 64): string {
    return randomBytes(length).toString('hex');
  }

  public randomBase64(length = 48): string {
    return randomBytes(length).toString('base64');
  }

  numericCode(length = 6): string {
    return Array.from({ length }, () => randomInt(0, 10)).join('');
  }
}
