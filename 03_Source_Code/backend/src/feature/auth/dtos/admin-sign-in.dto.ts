import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AdminSignInDTO {
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
