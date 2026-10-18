import {
  IsString,
  IsNotEmpty,
  IsOptional,
  Length,
  Matches,
  IsIn,
  IsBoolean,
  IsNumber,
} from 'class-validator';

export class SubmitReportDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{15}$/, { message: 'IMEI must be exactly 15 numeric digits' })
  imei!: string;

  @IsString()
  @IsNotEmpty()
  @Length(5, 2000)
  description!: string;

  @IsString()
  @IsOptional()
  @Length(0, 150)
  location?: string;

  @IsString()
  @IsOptional()
  @Length(0, 150)
  deviceName?: string;

  @IsString()
  @IsOptional()
  @Length(0, 100)
  brand?: string;

  @IsString()
  @IsOptional()
  @Length(0, 100)
  model?: string;

  @IsString()
  @IsOptional()
  @IsIn(['LOST', 'STOLEN'])
  reportType?: 'LOST' | 'STOLEN';

  @IsString()
  @IsOptional()
  lossDate?: string;

  @IsString()
  @IsOptional()
  @Length(0, 100)
  policeGdNumber?: string;

  @IsString()
  @IsOptional()
  @Length(0, 100)
  policeStation?: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 30)
  contactNumber!: string;

  @IsOptional()
  notificationPreferences?: any;

  @IsBoolean()
  @IsOptional()
  extractedFromGd?: boolean;

  @IsNumber()
  @IsOptional()
  aiExtractionConfidence?: number;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @Matches(/^(data:(image\/(jpeg|png|webp)|application\/pdf);base64,[A-Za-z0-9+/=\s]+|LEGACY_[A-Za-z0-9_-]+)?$/, {
    message: 'gdImage must be a valid image (JPEG, PNG, WebP) or PDF base64 Data URL',
  })
  gdImage?: string;
}
