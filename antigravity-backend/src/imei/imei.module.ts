import { Module } from '@nestjs/common';
import { ImeiController } from './imei.controller';
import { ImeiService } from './imei.service';
import { SearchLogsModule } from '../search-logs/search-logs.module';
import { SearchEventsModule } from '../search-events/search-events.module';

@Module({
  imports: [SearchLogsModule, SearchEventsModule],
  controllers: [ImeiController],
  providers: [ImeiService]
})
export class ImeiModule {}
