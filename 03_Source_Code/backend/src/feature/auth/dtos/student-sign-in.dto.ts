import { IsNotEmpty, IsString } from 'class-validator';

export class StudentSignInDTO {
  @IsNotEmpty({ message: 'Username tidak boleh kosong' })
  @IsString({ message: 'Username harus berupa string' })
  username: string;

  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  @IsString({ message: 'Password harus berupa string' })
  password: string;
}
