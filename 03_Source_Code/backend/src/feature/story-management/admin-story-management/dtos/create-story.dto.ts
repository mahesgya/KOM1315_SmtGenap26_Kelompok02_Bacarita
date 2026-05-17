import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateStoryDTO {
  @IsString({ message: 'Judul harus berupa string' })
  @IsNotEmpty({ message: 'Judul tidak boleh kosong' })
  title: string;

  @IsString({ message: 'Deskripsi harus berupa string' })
  @IsOptional()
  description?: string;

  @IsString({ message: 'Passage harus berupa string' })
  @IsNotEmpty({ message: 'Passage tidak boleh kosong' })
  passage: string;
}
