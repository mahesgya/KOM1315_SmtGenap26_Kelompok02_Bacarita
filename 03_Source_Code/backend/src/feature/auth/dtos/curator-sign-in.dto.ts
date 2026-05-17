import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CuratorSignInDTO {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
