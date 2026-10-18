import { Test, TestingModule } from '@nestjs/testing';
import { ImeiService } from './imei.service';
import { PrismaService } from '../prisma/prisma.service';
import { SearchLogsService } from '../search-logs/search-logs.service';
import { SearchEventsService } from '../search-events/search-events.service';
import { AiService } from '../ai/ai.service';

describe('ImeiService', () => {
  let service: ImeiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImeiService,
        { provide: PrismaService, useValue: { device: { findUnique: jest.fn() } } },
        { provide: SearchLogsService, useValue: { logSearch: jest.fn() } },
        { provide: SearchEventsService, useValue: { createEvent: jest.fn() } },
        { provide: AiService, useValue: { analyzeRisk: jest.fn() } },
      ],
    }).compile();

    service = module.get<ImeiService>(ImeiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should validate Luhn correctly', () => {
    // Valid 15-digit IMEI
    expect(service.validateLuhn('490154203237518')).toBe(true);
    // Invalid 15-digit IMEI
    expect(service.validateLuhn('490154203237519')).toBe(false);
  });
});
