import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Curator } from '../entities/curator.entity';
import { CuratorService } from './curator.service';

@Module({
  imports: [TypeOrmModule.forFeature([Curator])],
  providers: [CuratorService],
  exports: [CuratorService],
})
export class CuratorModule {}
