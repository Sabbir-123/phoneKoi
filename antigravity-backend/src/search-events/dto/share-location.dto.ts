import { IsString, IsNotEmpty, IsOptional, Matches, IsNumber } from 'class-validator';

export class ShareLocationDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{15}$/, { message: 'IMEI must be 15 numeric digits' })
  imei!: string;

  @IsNumber()
  latitude!: number;

  @IsNumber()
  longitude!: number;

  @IsOptional()
  @IsNumber()
  accuracy?: number;

  @IsOptional()
  @IsString()
  clientLocation?: string;
}
