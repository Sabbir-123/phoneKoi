import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { PoliceRecoveryService } from './police-recovery.service';
import { CreatePoliceRecoveryDriveDto } from './dto/create-drive.dto';
import { ExtractDocumentDto, ExtractUrlDto } from './dto/extract-drive.dto';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('police-recovery')
export class PoliceRecoveryController {
  constructor(private readonly policeRecoveryService: PoliceRecoveryService) {}

  /**
   * Public: Check if an IMEI is in police recovered custody
   */
  @Public()
  @Get('search')
  async searchRecovered(@Query('imei') imei: string) {
    return this.policeRecoveryService.searchRecovered(imei);
  }

  /**
   * Public: List published police recovery drives
   */
  @Public()
  @Get('drives')
  async getDrives(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
  ) {
    return this.policeRecoveryService.getDrives(parseInt(page, 10) || 1, parseInt(limit, 10) || 10, search);
  }

  /**
   * Public: Get details of a single recovery drive
   */
  @Public()
  @Get('drives/:id')
  async getDriveById(@Param('id') id: string) {
    return this.policeRecoveryService.getDriveById(id);
  }

  /**
   * Admin: Extract drive & devices from police news article URL
   */
  @Roles('ADMIN')
  @Post('extract-url')
  async extractFromUrl(@Body() dto: ExtractUrlDto) {
    return this.policeRecoveryService.extractFromUrl(dto);
  }

  /**
   * Admin: Extract drive & devices from PDF/Image OCR or pasted text
   */
  @Roles('ADMIN')
  @Post('extract-document')
  async extractFromDocument(@Body() dto: ExtractDocumentDto) {
    return this.policeRecoveryService.extractFromDocument(dto);
  }

  /**
   * Admin: Publish verified recovery drive to database & cross-reference stolen reports
   */
  @Roles('ADMIN')
  @Post('create')
  async createDrive(@Body() dto: CreatePoliceRecoveryDriveDto, @CurrentUser() user: any) {
    return this.policeRecoveryService.createDrive(dto, user);
  }

  /**
   * Admin: Delete recovery drive
   */
  @Roles('ADMIN')
  @Delete('drives/:id')
  async deleteDrive(@Param('id') id: string) {
    return this.policeRecoveryService.deleteDrive(id);
  }
}
