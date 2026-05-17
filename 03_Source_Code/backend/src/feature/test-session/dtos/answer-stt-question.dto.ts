import { IsNotEmpty, IsNumber, IsPositive, Length } from 'class-validator';

export class AnswerSTTQuestionDTO {
  @IsNotEmpty({ message: 'spokenWord tidak boleh kosong' })
  @Length(1, 255, {
    message:
      'spokenWord harus memiliki panjang antara $constraint1 hingga $constraint2 karakter',
  })
  spokenWord: string;

  @IsNotEmpty({ message: 'accuracy tidak boleh kosong' })
  @IsNumber({}, { message: 'accuracy harus berupa angka' })
  @IsPositive({ message: 'accuracy harus berupa angka positif' })
  accuracy: number;
}
