import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  Length,
} from 'class-validator';
import { DistractionType } from '../enums/distraction-type.enum';

export class CreateDistractionEventDTO {
  @IsNotEmpty({ message: 'distractionType tidak boleh kosong' })
  @IsEnum(DistractionType, {
    message:
      'distractionType harus berupa FOCUS, TURNING, GLANCE, atau NOT_DETECTED',
  })
  distractionType: DistractionType;

  @IsNotEmpty({ message: 'triggerDurationMs tidak boleh kosong' })
  @IsInt({ message: 'triggerDurationMs harus berupa angka bulat' })
  @IsPositive({ message: 'triggerDurationMs harus berupa angka positif' })
  triggerDurationMs: number;

  @IsNotEmpty({ message: 'occurAtWord tidak boleh kosong' })
  @IsString({ message: 'occurAtWord harus berupa string' })
  @Length(1, 255, {
    message:
      'occurAtWord harus memiliki panjang antara $constraint1 hingga $constraint2 karakter',
  })
  occurAtWord: string;
}
