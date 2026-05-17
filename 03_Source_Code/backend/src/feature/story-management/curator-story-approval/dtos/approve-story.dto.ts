import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { StoryStatus } from 'src/feature/levels/enum/story-status.enum';

export class ApproveStoryDTO {
  @IsEnum([StoryStatus.ACCEPTED, StoryStatus.REJECTED], {
    message: 'Status harus berupa ACCEPTED atau REJECTED',
  })
  @IsNotEmpty({ message: 'Status tidak boleh kosong' })
  status: StoryStatus.ACCEPTED | StoryStatus.REJECTED;

  @IsString({ message: 'Alasan harus berupa string' })
  @IsOptional()
  reason?: string;
}
