import { Controller, Get, Post, Param, Query, Body, Req, ForbiddenException } from '@nestjs/common';
import { SearchEventsService } from './search-events.service';
import { Public } from '../auth/public.decorator';
import { Throttle } from '@nestjs/throttler';

@Controller('search-events')
export class SearchEventsController {
  constructor(private readonly searchEventsService: SearchEventsService) {}

  @Get('owner')
  async getOwnerEvents(
    @Req() req: any,
    @Query('imei') imei?: string,
    @Query('read') read?: string,
    @Query('locationType') locationType?: string,
  ) {
    const caller = req.user;
    if (!caller) {
      throw new ForbiddenException('Authentication required');
    }
    return this.searchEventsService.getOwnerEvents(caller.email, { imei, read, locationType });
  }

  @Get('summary')
  async getOwnerSummary(@Req() req: any) {
    const caller = req.user;
    if (!caller) {
      throw new ForbiddenException('Authentication required');
    }
    return this.searchEventsService.getOwnerSummary(caller.email);
  }

  @Get(':id')
  async getEventById(@Param('id') id: string, @Req() req: any) {
    const caller = req.user;
    if (!caller) {
      throw new ForbiddenException('Authentication required');
    }
    return this.searchEventsService.getEventById(id, caller.email);
  }

  @Post(':id/mark-read')
  async markRead(@Param('id') id: string, @Req() req: any) {
    const caller = req.user;
    if (!caller) {
      throw new ForbiddenException('Authentication required');
    }
    return this.searchEventsService.markEventAsRead(id, caller.email);
  }

  @Post('mark-all-read')
  async markAllRead(@Req() req: any) {
    const caller = req.user;
    if (!caller) {
      throw new ForbiddenException('Authentication required');
    }
    return this.searchEventsService.markAllAsRead(caller.email);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('report-seller')
  async reportSeller(
    @Body()
    body: {
      imei: string;
      sellerContact: string;
      sellerLocation?: string;
      notes?: string;
      reporterEmail?: string;
    },
  ) {
    return this.searchEventsService.saveSellerReport(body);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('contact-owner')
  async contactOwner(
    @Body()
    body: {
      imei: string;
      senderContact: string;
      message: string;
    },
  ) {
    return this.searchEventsService.saveOwnerMessage(body);
  }
}
