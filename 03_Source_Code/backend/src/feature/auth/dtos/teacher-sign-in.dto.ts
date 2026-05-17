import { IsEmail, IsNotEmpty, IsString, ValidateIf } from 'class-validator';

export class TeacherSignInDTO {
  @ValidateIf((o: TeacherSignInDTO) => !o.username)
  @IsNotEmpty({ message: 'Email atau username harus diisi' })
  @IsEmail({}, { message: 'Format email tidak valid' })
  email?: string;

  @ValidateIf((o: TeacherSignInDTO) => !o.email)
  @IsNotEmpty({ message: 'Email atau username harus diisi' })
  @IsString({ message: 'Username harus berupa string' })
  username?: string;

  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  @IsString({ message: 'Password harus berupa string' })
  password: string;
}
