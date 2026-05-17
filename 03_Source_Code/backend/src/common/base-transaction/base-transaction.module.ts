import { Module } from '@nestjs/common';
import { ITransactionalService } from './transactional.interface.service';

@Module({
  providers: [ITransactionalService],
})
export class BaseTransactionModule {}
