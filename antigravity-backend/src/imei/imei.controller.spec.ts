import { Test, TestingModule } from '@nestjs/testing';
import { ImeiController } from './imei.controller';

describe('ImeiController', () => {
  let controller: ImeiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImeiController],
    }).compile();

    controller = module.get<ImeiController>(ImeiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
