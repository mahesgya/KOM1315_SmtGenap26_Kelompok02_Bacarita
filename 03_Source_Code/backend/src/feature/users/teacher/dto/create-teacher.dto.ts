import { Transform } from 'class-transformer';
import {
  IsAlphanumeric,
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateTeacherDTO {
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  @IsEmail({}, { message: 'Format email tidak valid' })
  @MaxLength(255, { message: 'Email maksimal 255 karakter' })
  email: string;

  @IsString({ message: 'Username harus berupa string' })
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  @Matches(/^\S+$/, { message: 'Username tidak boleh ada spasi' })
  @IsNotEmpty({ message: 'Username tidak boleh kosong' })
  @IsAlphanumeric(undefined, {
    message: 'Username hanya boleh berisi huruf dan angka',
  })
  @MaxLength(90, { message: 'Username maksimal 90 karakter' })
  username: string;

  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  @IsString({ message: 'Password harus berupa string' })
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  @MaxLength(255, { message: 'Password maksimal 255 karakter' })
  password: string;

  @IsNotEmpty({ message: 'Konfirmasi password tidak boleh kosong' })
  @IsString({ message: 'Konfirmasi password harus berupa string' })
  @MinLength(8, { message: 'Konfirmasi password minimal 8 karakter' })
  @MaxLength(255, { message: 'Konfirmasi password maksimal 255 karakter' })
  confirmPassword: string;

  @IsNotEmpty({ message: 'Nama lengkap tidak boleh kosong' })
  @IsString({ message: 'Nama lengkap harus berupa string' })
  @MaxLength(255, { message: 'Nama lengkap maksimal 255 karakter' })
  fullName: string;

  @IsNotEmpty({ message: 'Nama sekolah tidak boleh kosong' })
  @IsString({ message: 'Nama sekolah harus berupa string' })
  @MaxLength(255, { message: 'Nama sekolah maksimal 255 karakter' })
  schoolName: string;
}
