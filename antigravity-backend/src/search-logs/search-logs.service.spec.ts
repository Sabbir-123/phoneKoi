import { Test, TestingModule } from '@nestjs/testing';
import { SearchLogsService } from './search-logs.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SearchLogsService', () => {
  let service: SearchLogsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchLogsService,
        {
          provide: PrismaService,
          useValue: {
            device: { upsert: jest.fn() },
            searchLog: { create: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get<SearchLogsService>(SearchLogsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
