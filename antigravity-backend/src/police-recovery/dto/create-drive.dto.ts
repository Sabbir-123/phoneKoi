export interface RecoveredDeviceItemDto {
  brand?: string;
  model?: string;
  imei1?: string;
  imei2?: string;
  serialNumber?: string;
  rawText?: string;
}

export class CreatePoliceRecoveryDriveDto {
  title: string;
  agency: string;
  policeStation?: string;
  caseNumber?: string;
  officerName?: string;
  officerContact?: string;
  mediaContact?: string;
  claimInstructions?: string;
  sourceUrl?: string;
  driveDate?: string;
  devices: RecoveredDeviceItemDto[];
}
