import { Test, TestingModule } from '@nestjs/testing';
import { ImeiController } from './imei.controller';
import { ImeiService } from './imei.service';

describe('ImeiController', () => {
  let controller: ImeiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImeiController],
      providers: [
        {
          provide: ImeiService,
          useValue: {
            checkImei: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ImeiController>(ImeiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
