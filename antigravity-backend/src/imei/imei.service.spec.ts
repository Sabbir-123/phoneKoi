import { Test, TestingModule } from '@nestjs/testing';
import { ImeiService } from './imei.service';

describe('ImeiService', () => {
  let service: ImeiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImeiService],
    }).compile();

    service = module.get<ImeiService>(ImeiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
