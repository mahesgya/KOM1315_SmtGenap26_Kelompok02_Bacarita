import { IsOptional, IsString } from 'class-validator';

export class UpdateStoryDTO {
  @IsString({ message: 'Judul harus berupa string' })
  @IsOptional()
  title?: string;

  @IsString({ message: 'Deskripsi harus berupa string' })
  @IsOptional()
  description?: string;

  @IsString({ message: 'Passage harus berupa string' })
  @IsOptional()
  passage?: string;
}
