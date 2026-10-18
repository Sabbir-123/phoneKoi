import { IsString, IsNotEmpty, IsOptional, Length, Matches, IsEmail } from 'class-validator';

export class SellerReportDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{15}$/, { message: 'IMEI must be 15 numeric digits' })
  imei!: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 40)
  sellerContact!: string;

  @IsString()
  @IsOptional()
  @Length(0, 150)
  sellerLocation?: string;

  @IsString()
  @IsOptional()
  @Length(0, 1000)
  notes?: string;

  @IsString()
  @IsOptional()
  @IsEmail()
  reporterEmail?: string;
}
