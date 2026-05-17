import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class StartNewTestSessionDTO {
  @IsNumber({}, { message: 'storyId harus berupa angka' })
  @IsPositive({ message: 'storyId harus berupa angka positif' })
  @IsNotEmpty({ message: 'storyId tidak boleh kosong' })
  storyId: number;
}
