import { BadRequestException, ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { BoardService } from './board.service';
import { EmailService } from '../email/email.service';
import { RedisService } from '../redis/redis.service';
import { Board } from './entities/board.entity';
import { User } from '../user/entities/user.entity';
import { BoardMember } from './entities/board-member.entity';

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
        sendEmailVerificationLink: jest.fn(),
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BoardService,
        EmailService,
        RedisService,
        {
          provide: getRepositoryToken(Board),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(BoardMember),
          useClass: Repository,
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
            }),
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
  });

  describe('sendVerificationEmail', () => {
    it('보드 초대 링크를 전송해야 함', async () => {
      const board = new Board();
      board.adminId = 1;
      jest.spyOn(boardRepository, 'findOne').mockResolvedValue(board);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(new User());
      jest.spyOn(boardMemberRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(emailService, 'sendEmailVerificationLink').mockResolvedValue('test-token');

      const result = await boardService.sendVerificationEmail(1, 'test@example.com', 1);
      expect(result).toBe('test-token');
    });

    it('초대하는 보드가 없으면 NotFoundException를 던져야 함', async () => {
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

    it('보낼 이메일이 초대할 보드의 boardMember이면 ConflictException을 던져야 함', async () => {
      const board = new Board();
      board.adminId = 1;
      jest.spyOn(boardRepository, 'findOne').mockResolvedValue(board);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(new User());
      jest.spyOn(boardMemberRepository, 'findOne').mockResolvedValue(new BoardMember());

      await expect(boardService.sendVerificationEmail(1, 'test@example.com', 1)).rejects.toThrow(ConflictException);
    });
  });

  describe('acceptInvitation', () => {
    it('초대받은 사람이 board_members에 저장되어야 함', async () => {
      jest
        .spyOn(emailService, 'verifyTokenData')
        .mockResolvedValue({ boardId: 1, userId: 1, email: 'test@example.com' });
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(new User());
      jest.spyOn(boardMemberRepository, 'save').mockResolvedValue(new BoardMember());

      const result = await boardService.acceptInvitation(1, 'valid-token');
      expect(result).toBe(1);
    });

    it('accesstoken이 유효하지 않거나 만료되었으면 BadRequestException을 던져야 함', async () => {
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
