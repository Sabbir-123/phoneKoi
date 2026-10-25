export class ExtractUrlDto {
  url: string;
}

export class ExtractDocumentDto {
  text?: string;
  base64File?: string;
  mimeType?: string;
  fileName?: string;
}
