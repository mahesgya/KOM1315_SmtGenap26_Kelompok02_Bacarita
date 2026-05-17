import { Module, Global } from '@nestjs/common';
import { TokenGeneratorService } from './token-generator.service';

@Global()
@Module({
  providers: [TokenGeneratorService],
  exports: [TokenGeneratorService],
})
export class TokenGeneratorModule {}
