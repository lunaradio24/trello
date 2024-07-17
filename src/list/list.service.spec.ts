import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ListService } from './list.service';
import { List } from './entities/list.entity';
import { Board } from '../board/entities/board.entity';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';
import { MoveListDto } from './dto/move-list.dto';

// Mock Repository
const mockRepository = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  softRemove: jest.fn(),
  find: jest.fn(),
  findBy: jest.fn(),
});

describe('ListService', () => {
  let service: ListService;
  let listRepository;
  let boardRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListService,
        {
          provide: getRepositoryToken(List),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Board),
          useValue: mockRepository(),
        },
      ],
    }).compile();

    service = module.get<ListService>(ListService);
    listRepository = module.get(getRepositoryToken(List));
    boardRepository = module.get(getRepositoryToken(Board));
  });

  it('리스트 서비스가 정의되어 있는지를 확인합니다', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('새 리스트를 생성하는지를 확인합니다', async () => {
      const createListDto: CreateListDto = { boardId: 1, title: '새 리스트' };
      const board = new Board();
      board.id = 1;
      board.lists = [];

      boardRepository.findOne.mockResolvedValue(board);
      listRepository.create.mockReturnValue(new List());
      listRepository.save.mockResolvedValue(new List());

      const result = await service.create(createListDto);
      expect(result).toBeInstanceOf(List);
    });

    it('보드가 존재하지 않으면 NotFoundException을 발생시켜야 합니다.', async () => {
      const createListDto: CreateListDto = { boardId: 1, title: '새 리스트' };

      boardRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createListDto)).rejects.toThrow(NotFoundException);
    });

    it('리스트가 10개를 넘으면 ConflictException을 발생시켜야 합니다.', async () => {
      const createListDto: CreateListDto = { boardId: 1, title: '새 리스트' };
      const board = new Board();
      board.id = 1;
      board.lists = Array(10).fill(new List());

      boardRepository.findOne.mockResolvedValue(board);

      await expect(service.create(createListDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findOneByListId', () => {
    it('리스트를 반환해야 합니다.', async () => {
      const list = new List();
      listRepository.findOne.mockResolvedValue(list);

      const result = await service.findOneByListId(1);
      expect(result).toBe(list);
    });

    it('리스트가 존재하지 않으면 NotFoundException을 발생시켜야 합니다.', async () => {
      listRepository.findOne.mockResolvedValue(null);

      await expect(service.findOneByListId(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('리스트를 수정시켜야 합니다.', async () => {
      const updateListDto: UpdateListDto = { title: '수정된 리스트' };
      const list = new List();
      list.board = new Board();
      list.board.id = 1;

      boardRepository.findOne.mockResolvedValue(list.board);
      service.findOneByListId = jest.fn().mockResolvedValue(list);
      listRepository.update.mockResolvedValue(undefined);

      const result = await service.update(1, 1, updateListDto);
      expect(result).toBe(list);
    });

    it('보드가 존재하지 않으면 NotFoundException을 발생시켜야 합니다.', async () => {
      const updateListDto: UpdateListDto = { title: '수정된 리스트' };

      boardRepository.findOne.mockResolvedValue(null);

      await expect(service.update(1, 1, updateListDto)).rejects.toThrow(NotFoundException);
    });

    it('리스트가 보드에 속하지 않으면 BadRequestException을 발생시켜야 합니다.', async () => {
      const updateListDto: UpdateListDto = { title: '수정된 리스트' };
      const list = new List();
      list.board = new Board();
      list.board.id = 2;

      boardRepository.findOne.mockResolvedValue(new Board());
      service.findOneByListId = jest.fn().mockResolvedValue(list);

      await expect(service.update(1, 1, updateListDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('리스트를 소프트 delete해야 합니다.', async () => {
      const list = new List();
      list.id = 1;
      list.board = new Board();
      list.board.id = 1;

      boardRepository.findOne.mockResolvedValue(list.board);
      service.findOneByListId = jest.fn().mockResolvedValue(list);
      listRepository.softRemove.mockResolvedValue(undefined);
      listRepository.findOne.mockResolvedValue({ ...list, deletedAt: new Date() });

      const result = await service.remove(1, 1);
      expect(result).toHaveProperty('deletedAt');
    });

    it('보드가 존재하지 않으면 NotFoundException을 발생시켜야 합니다.', async () => {
      boardRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(1, 1)).rejects.toThrow(NotFoundException);
    });

    it('리스트가 보드에 속하지 않으면 BadRequestException을 발생시켜야 합니다.', async () => {
      const list = new List();
      list.board = new Board();
      list.board.id = 2;

      boardRepository.findOne.mockResolvedValue(new Board());
      service.findOneByListId = jest.fn().mockResolvedValue(list);

      await expect(service.remove(1, 1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('move', () => {
    it('리스트를 이동해야 합니다.', async () => {
      const moveListDto: MoveListDto = { targetIndex: 1 };
      const list = new List();
      list.id = 1;
      list.board = new Board();
      list.board.id = 1;
      const targetList = new List();
      targetList.id = 2;
      const boardLists = [targetList, list];
      listRepository.findOne.mockResolvedValueOnce(list);
      listRepository.find.mockResolvedValue(boardLists);
      listRepository.save.mockResolvedValue(list);

      const result = await service.move(1, moveListDto);
      expect(result).toBe(list);
    });

    it('유효한 인덱스가 아니면 BadRequestException을 발생시켜야 합니다.', async () => {
      const moveListDto: MoveListDto = { targetIndex: 0 };
      const list = new List();
      list.id = 1;
      list.board = new Board();
      list.board.id = 1;

      listRepository.findOne.mockResolvedValue(list);
      listRepository.find.mockResolvedValue([list]);

      await expect(service.move(1, moveListDto)).rejects.toThrow(BadRequestException);
    });

    it('같은 위치로 이동하면 BadRequestException을 발생시켜야 합니다.', async () => {
      const moveListDto: MoveListDto = { targetIndex: 1 };
      const list = new List();
      list.id = 1;
      list.board = new Board();
      list.board.id = 1;

      listRepository.findOne.mockResolvedValue(list);
      listRepository.find.mockResolvedValue([list]);

      await expect(service.move(1, moveListDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAllBoards', () => {
    it('보드의 모든 리스트를 반환해야 합니다.', async () => {
      const lists = [new List(), new List()];
      listRepository.findBy.mockResolvedValue(lists);

      const result = await service.findAllBoards(1);
      expect(result).toBe(lists);
    });
  });
});
