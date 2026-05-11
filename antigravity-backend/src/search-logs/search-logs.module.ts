import { Module } from '@nestjs/common';
import { SearchLogsService } from './search-logs.service';

@Module({
  providers: [SearchLogsService],
  exports: [SearchLogsService]
})
export class SearchLogsModule {}
