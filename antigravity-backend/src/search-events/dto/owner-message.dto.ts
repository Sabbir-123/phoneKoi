import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';

export class OwnerMessageDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{15}$/, { message: 'IMEI must be 15 numeric digits' })
  imei!: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 40)
  senderContact!: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 1000)
  message!: string;
}
