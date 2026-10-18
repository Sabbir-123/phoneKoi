import { IsString, IsNotEmpty, Length } from 'class-validator';

export class ExtractGdDto {
  @IsString()
  @IsNotEmpty({ message: 'Base64 image is required' })
  @Length(20, 15000000, { message: 'Image payload must be valid and under 10MB' })
  base64Image!: string;
}
