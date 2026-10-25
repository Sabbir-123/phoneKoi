import { IsString, IsNotEmpty, IsUrl, IsOptional } from 'class-validator';

export class ExtractUrlDto {
  @IsString()
  @IsNotEmpty()
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: 'Must be a valid HTTP or HTTPS URL' },
  )
  url!: string;
}

export class ExtractDocumentDto {
  @IsString()
  @IsOptional()
  text?: string;

  @IsString()
  @IsOptional()
  base64File?: string;

  @IsString()
  @IsOptional()
  mimeType?: string;

  @IsString()
  @IsOptional()
  fileName?: string;
}
