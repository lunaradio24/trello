import { BadRequestException, ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { BoardService } from './board.service';
import { EmailService } from '../email/email.service';
import { RedisService } from '../redis/redis.service';
import { Board } from './entities/board.entity';
import { User } from '../user/entities/user.entity';
import { BoardMember } from './entities/board-member.entity';
import { List } from '../list/entities/list.entity';
import { Card } from '../card/entities/card.entity';

jest.mock('../redis/redis.service', () => {
  return {
    RedisService: jest.fn().mockImplementation(() => {
      return {
        set: jest.fn(),
        get: jest.fn(),
        del: jest.fn(),
      };
    }),
  };
});

jest.mock('../email/email.service', () => {
  return {
    EmailService: jest.fn().mockImplementation(() => {
      return {
        sendBoardInvitationLink: jest.fn(),
        verifyTokenData: jest.fn(),
      };
    }),
  };
});

describe('BoardService', () => {
  let boardService: BoardService;
  let boardRepository: Repository<Board>;
  let userRepository: Repository<User>;
  let boardMemberRepository: Repository<BoardMember>;
  let emailService: EmailService;
  let redisService: RedisService;
  let dataSource: DataSource;

  let consoleErrorMock: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BoardService,
        EmailService,
        RedisService,
        {
          provide: getRepositoryToken(Board),
          useValue: {
            create: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue({
              leftJoin: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue([]),
            }),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(BoardMember),
          useValue: {
            create: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue({
              connect: jest.fn(),
              startTransaction: jest.fn(),
              manager: {
                save: jest.fn(),
              },
              commitTransaction: jest.fn(),
              rollbackTransaction: jest.fn(),
              release: jest.fn(),
            } as unknown as QueryRunner),
          },
        },
      ],
    }).compile();

    boardService = module.get<BoardService>(BoardService);
    boardRepository = module.get<Repository<Board>>(getRepositoryToken(Board));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    boardMemberRepository = module.get<Repository<BoardMember>>(getRepositoryToken(BoardMember));
    emailService = module.get<EmailService>(EmailService);
    redisService = module.get<RedisService>(RedisService);
    dataSource = module.get<DataSource>(DataSource);

    consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorMock.mockRestore();
  });

  describe('create', () => {
    it('board를 생성하고 저장해야 함', async () => {
      const createBoardDto = {
        title: 'Test Board',
        backgroundColor: '#FFFFFF',
        description: 'Test Description',
      };
      const userId = 1;
      const queryRunnerMock = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        manager: {
          save: jest.fn().mockResolvedValue(new Board()),
        },
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
      } as unknown as QueryRunner;

      jest.spyOn(dataSource, 'createQueryRunner').mockReturnValue(queryRunnerMock);
      jest.spyOn(boardRepository, 'create').mockReturnValue(new Board());
      jest.spyOn(boardMemberRepository, 'create').mockReturnValue(new BoardMember());

      const result = await boardService.create(userId, createBoardDto);
      expect(queryRunnerMock.connect).toHaveBeenCalled();
      expect(queryRunnerMock.startTransaction).toHaveBeenCalled();
      expect(queryRunnerMock.manager.save).toHaveBeenCalled();
      expect(queryRunnerMock.commitTransaction).toHaveBeenCalled();
      expect(queryRunnerMock.release).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Board);
    });

    it('board 생성 중 에러가 발생하면 트랜잭션을 롤백해야 함', async () => {
      const createBoardDto = {
        title: 'Test Board',
        backgroundColor: '#FFFFFF',
        description: 'Test Description',
      };
      const userId = 1;
      const queryRunnerMock = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        manager: {
          save: jest.fn().mockRejectedValue(new Error('Test Error')),
        },
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
      } as unknown as QueryRunner;

      jest.spyOn(dataSource, 'createQueryRunner').mockReturnValue(queryRunnerMock);
      jest.spyOn(boardRepository, 'create').mockReturnValue(new Board());
      jest.spyOn(boardMemberRepository, 'create').mockReturnValue(new BoardMember());

      await expect(boardService.create(userId, createBoardDto)).rejects.toThrow(Error);
      expect(queryRunnerMock.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunnerMock.release).toHaveBeenCalled();
      expect(consoleErrorMock).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('member로 등록된 모든 boards를 반환', async () => {
      const userId = 1;
      const boards = [new Board()];
      jest.spyOn(boardRepository, 'createQueryBuilder').mockReturnValue({
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(boards),
      } as any);

      const result = await boardService.findAll(userId);
      expect(result).toBe(boards);
    });
  });

  describe('findOne', () => {
    it('boards, lists, cards를 정상적으로 반환해야 함', async () => {
      const board = new Board();
      board.id = 1;
      board.adminId = 1;
      const list = new List();
      list.id = 1;
      list.position = 2;
      const card1 = new Card();
      card1.id = 1;
      card1.position = 2;
      const card2 = new Card();
      card2.id = 2;
      card2.position = 1;
      list.cards = [card1, card2];
      board.lists = [list];
      const member = new BoardMember();
      member.memberId = 1;
      board.members = [member];
      jest.spyOn(boardRepository, 'findOne').mockResolvedValue(board);

      const result = await boardService.findOne(1, 1);
      expect(result).toBe(board);
      expect(result.lists[0].cards[0].position).toBe(1);
    });

    it('board가 없으면 NotFoundException을 던져야 함', async () => {
      jest.spyOn(boardRepository, 'findOne').mockResolvedValue(null);

      await expect(boardService.findOne(1, 1)).rejects.toThrow(NotFoundException);
    });

    it('member가 아닌 user가 조회하면 UnauthorizedException을 던져야 함', async () => {
      const board = new Board();
      board.id = 1;
      board.adminId = 2;
      const member = new BoardMember();
      member.memberId = 2;
      board.members = [member];
      jest.spyOn(boardRepository, 'findOne').mockResolvedValue(board);

      await expect(boardService.findOne(1, 1)).rejects.toThrow(UnauthorizedException);
    });
  });
  describe('update', () => {
    it('board를 수정하고 저장해야 함', async () => {
      const boardId = 1;
      const userId = 1;
      const updateBoardDto = {
        title: 'Updated Board',
        backgroundColor: '#000000',
        description: 'Updated Description',
      };
      const board = new Board();
      board.id = boardId;
      board.adminId = userId;

      jest.spyOn(boardRepository, 'findOne').mockResolvedValue(board);
      jest.spyOn(boardRepository, 'update').mockResolvedValue(undefined);
      jest.spyOn(boardRepository, 'findOne').mockResolvedValue({ ...board, ...updateBoardDto });

      const result = await boardService.update(boardId, userId, updateBoardDto);
      expect(result.title).toBe(updateBoardDto.title);
      expect(result.backgroundColor).toBe(updateBoardDto.backgroundColor);
      expect(result.description).toBe(updateBoardDto.description);
    });

    it('board가 없으면 NotFoundException을 던져야 함', async () => {
      const boardId = 1;
      const userId = 1;
      const updateBoardDto = {
        title: 'Updated Board',
        backgroundColor: '#000000',
        description: 'Updated Description',
      };

      jest.spyOn(boardRepository, 'findOne').mockResolvedValue(null);

      await expect(boardService.update(boardId, userId, updateBoardDto)).rejects.toThrow(NotFoundException);
    });

    it('admin이 아닌 member가 수정하는 경우 UnauthorizedException을 던져야 함', async () => {
      const boardId = 1;
      const userId = 2;
      const updateBoardDto = {
        title: 'Updated Board',
        backgroundColor: '#000000',
        description: 'Updated Description',
      };
      const board = new Board();
      board.id = boardId;
      board.adminId = 1; // 다른 사용자

      jest.spyOn(boardRepository, 'findOne').mockResolvedValue(board);

      await expect(boardService.update(boardId, userId, updateBoardDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('delete', () => {
    it('board를 softDelete해야 함', async () => {
      const boardId = 1;
      const userId = 1;
      const board = new Board();
      board.id = boardId;
      board.adminId = userId;

      jest
        .spyOn(boardRepository, 'findOne')
        .mockResolvedValueOnce(board) // for the initial findOne call
        .mockResolvedValueOnce({ ...board, deletedAt: new Date() }); // for the findOne call after softDelete

      jest.spyOn(boardRepository, 'softDelete').mockResolvedValue(undefined);

      const result = await boardService.delete(boardId, userId);
      expect(result).toHaveProperty('boardId', boardId);
      expect(result).toHaveProperty('deletedAt');
    });

    it('board가 없으면 NotFoundException을 던져야 함', async () => {
      const boardId = 1;
      const userId = 1;

      jest.spyOn(boardRepository, 'findOne').mockResolvedValue(null);

      await expect(boardService.delete(boardId, userId)).rejects.toThrow(NotFoundException);
    });

    it('admin이 아닌 member가 삭제하려 하면 UnauthorizedException을 던져야 함', async () => {
      const boardId = 1;
      const userId = 2;
      const board = new Board();
      board.id = boardId;
      board.adminId = 1; // 다른 사용자

      jest.spyOn(boardRepository, 'findOne').mockResolvedValue(board);

      await expect(boardService.delete(boardId, userId)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('sendVerificationEmail', () => {
    it('board 초대 링크를 전송해야 함', async () => {
      const board = new Board();
      board.adminId = 1;
      jest.spyOn(boardRepository, 'findOne').mockResolvedValue(board);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(new User());
      jest.spyOn(boardMemberRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(emailService, 'sendBoardInvitationLink').mockResolvedValue('test-token');

      const result = await boardService.sendVerificationEmail(1, 'test@example.com', 1);
      expect(result).toBe('test-token');
    });

    it('초대하는 board가 없으면 NotFoundException을 던져야 함', async () => {
      jest.spyOn(boardRepository, 'findOne').mockResolvedValue(null);

      await expect(boardService.sendVerificationEmail(1, 'test@example.com', 1)).rejects.toThrow(NotFoundException);
    });

    it('메일을 보내는 사람(초대하는 사람)이 이 보드의 admin이 아니면 UnauthorizedException을 던져야 함', async () => {
      const board = new Board();
      board.adminId = 2;
      jest.spyOn(boardRepository, 'findOne').mockResolvedValue(board);

      await expect(boardService.sendVerificationEmail(1, 'test@example.com', 1)).rejects.toThrow(UnauthorizedException);
    });

    it('초대를 보낼 이메일의 user가 등록되어 있지 않으면 NotFoundException을 던져야 함', async () => {
      const board = new Board();
      board.adminId = 1;
      jest.spyOn(boardRepository, 'findOne').mockResolvedValue(board);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(boardService.sendVerificationEmail(1, 'test@example.com', 1)).rejects.toThrow(NotFoundException);
    });

    it('보낼 이메일이 초대할 board의 boardMember이면 ConflictException을 던져야 함', async () => {
      const board = new Board();
      board.adminId = 1;
      jest.spyOn(boardRepository, 'findOne').mockResolvedValue(board);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(new User());
      jest.spyOn(boardMemberRepository, 'findOne').mockResolvedValue(new BoardMember());

      await expect(boardService.sendVerificationEmail(1, 'test@example.com', 1)).rejects.toThrow(ConflictException);
    });
  });

  describe('acceptInvitation', () => {
    it('초대받은 사람이 boardMembers에 저장되어야 함', async () => {
      jest
        .spyOn(emailService, 'verifyTokenData')
        .mockResolvedValue({ boardId: 1, userId: 1, email: 'test@example.com' });
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(new User());
      jest.spyOn(boardMemberRepository, 'save').mockResolvedValue(new BoardMember());

      const result = await boardService.acceptInvitation(1, 'valid-token');
      expect(result).toBe(1);
    });

    it('accessToken이 유효하지 않거나 만료되었으면 BadRequestException을 던져야 함', async () => {
      jest.spyOn(emailService, 'verifyTokenData').mockResolvedValue({ message: 'Invalid token' });

      await expect(boardService.acceptInvitation(1, 'invalid-token')).rejects.toThrow(BadRequestException);
    });

    it('boardId와 userId가 유효하지 않으면 BadRequestException을 던져야 함', async () => {
      jest
        .spyOn(emailService, 'verifyTokenData')
        .mockResolvedValue({ userId: NaN, boardId: NaN, email: 'test@example.com' });

      await expect(boardService.acceptInvitation(1, 'invalid-token')).rejects.toThrow(BadRequestException);
    });

    it('링크를 들어간 사람이 user에 없으면 NotFoundException을 던져야 함', async () => {
      jest
        .spyOn(emailService, 'verifyTokenData')
        .mockResolvedValue({ boardId: 1, userId: 1, email: 'test@example.com' });
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(boardService.acceptInvitation(1, 'valid-token')).rejects.toThrow(NotFoundException);
    });
  });
});
