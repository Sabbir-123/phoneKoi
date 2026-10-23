import { IsString, IsNotEmpty, IsOptional, Length, Matches } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  email?: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  displayName!: string;

  @IsString()
  @IsNotEmpty()
  @Length(10, 20)
  @Matches(/^[0-9+\-\s()]+$/, { message: 'Phone number format is invalid' })
  phone!: string;

  @IsString()
  @IsOptional()
  @Length(0, 20)
  whatsapp?: string;

  @IsString()
  @IsNotEmpty()
  @Length(5, 300)
  address!: string;

  @IsString()
  @IsNotEmpty()
  avatar!: string;
}
