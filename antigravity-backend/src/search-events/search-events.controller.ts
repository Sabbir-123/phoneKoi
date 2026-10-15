import { Controller, Get, Post, Param, Query, Body, BadRequestException } from '@nestjs/common';
import { SearchEventsService } from './search-events.service';

@Controller('search-events')
export class SearchEventsController {
  constructor(private readonly searchEventsService: SearchEventsService) {}

  @Get('owner')
  async getOwnerEvents(
    @Query('email') email: string,
    @Query('imei') imei?: string,
    @Query('read') read?: string,
    @Query('locationType') locationType?: string,
  ) {
    if (!email) {
      throw new BadRequestException('Owner email is required');
    }
    return this.searchEventsService.getOwnerEvents(email, { imei, read, locationType });
  }

  @Get('summary')
  async getOwnerSummary(@Query('email') email: string) {
    if (!email) {
      throw new BadRequestException('Owner email is required');
    }
    return this.searchEventsService.getOwnerSummary(email);
  }

  @Get(':id')
  async getEventById(@Param('id') id: string, @Query('email') email?: string) {
    return this.searchEventsService.getEventById(id, email);
  }

  @Post(':id/mark-read')
  async markRead(@Param('id') id: string, @Query('email') email?: string) {
    return this.searchEventsService.markEventAsRead(id, email);
  }

  @Post('mark-all-read')
  async markAllRead(@Body('email') email: string) {
    if (!email) throw new BadRequestException('Email is required');
    return this.searchEventsService.markAllAsRead(email);
  }

  @Post('report-seller')
  async reportSeller(
    @Body() body: {
      imei: string;
      sellerContact: string;
      sellerLocation?: string;
      notes?: string;
      reporterEmail?: string;
    },
  ) {
    return this.searchEventsService.saveSellerReport(body);
  }

  @Post('contact-owner')
  async contactOwner(
    @Body() body: {
      imei: string;
      senderContact: string;
      message: string;
    },
  ) {
    return this.searchEventsService.saveOwnerMessage(body);
  }
}
