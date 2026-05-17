import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ParentSignInDTO {
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  @IsEmail({}, { message: 'Format email tidak valid' })
  email: string;

  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  @IsString({ message: 'Password harus berupa string' })
  password: string;
}
