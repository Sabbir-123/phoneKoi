import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { UsersService } from '../users/users.service';
import { SupabaseService } from '../auth/supabase.service';

describe('ReportsService', () => {
  let service: ReportsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: PrismaService,
          useValue: {
            report: { create: jest.fn(), findMany: jest.fn(), count: jest.fn() },
            device: { upsert: jest.fn() },
            user: { findUnique: jest.fn(), update: jest.fn() },
          },
        },
        {
          provide: AiService,
          useValue: {
            extractGdData: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            getUserProfile: jest.fn(),
          },
        },
        {
          provide: SupabaseService,
          useValue: {
            uploadFile: jest.fn().mockResolvedValue('reports/test.jpg'),
            getPublicUrl: jest.fn().mockReturnValue('https://test.supabase.co/storage/v1/object/public/gd-documents/reports/test.jpg'),
          },
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

