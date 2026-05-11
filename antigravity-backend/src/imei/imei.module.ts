import { Module } from '@nestjs/common';
import { ImeiController } from './imei.controller';
import { ImeiService } from './imei.service';
import { SearchLogsModule } from '../search-logs/search-logs.module';

@Module({
  imports: [SearchLogsModule],
  controllers: [ImeiController],
  providers: [ImeiService]
})
export class ImeiModule {}
