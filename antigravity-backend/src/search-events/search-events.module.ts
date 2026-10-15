import { Module } from '@nestjs/common';
import { SearchEventsController } from './search-events.controller';
import { SearchEventsService } from './search-events.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SearchEventsController],
  providers: [SearchEventsService],
  exports: [SearchEventsService],
})
export class SearchEventsModule {}
