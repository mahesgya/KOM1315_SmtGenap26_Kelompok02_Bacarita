import { Module } from '@nestjs/common';
import { AsymmetricSignatureService } from './asymmetric-signature.service';

@Module({
  providers: [AsymmetricSignatureService],
  exports: [AsymmetricSignatureService],
})
export class AsymmetricSignatureModule {}
