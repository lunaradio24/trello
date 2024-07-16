import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '../user/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { UserService } from '../user/user.service';
import { EmailService } from '../email/email.service';
import { RedisService } from '../redis/redis.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

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
        sendEmailVerificationCode: jest.fn(),
      };
    }),
  };
});

describe('AuthService', () => {
  let authService: AuthService;
  let userRepository: Repository<User>;
  let tokenRepository: Repository<RefreshToken>;
  let userService: UserService;
  let configService: ConfigService;
  let emailService: EmailService;
  let redisService: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        UserService,
        EmailService,
        RedisService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case 'REDIS_URL':
                  return 'redis://localhost:6379';
                case 'REDIS_TOKEN':
                  return 'test-token';
                default:
                  return null;
              }
            }),
          },
        },
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(RefreshToken),
          useClass: Repository,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    tokenRepository = module.get<Repository<RefreshToken>>(getRepositoryToken(RefreshToken));
    userService = module.get<UserService>(UserService);
    configService = module.get<ConfigService>(ConfigService);
    emailService = module.get<EmailService>(EmailService);
    redisService = module.get<RedisService>(RedisService);
  });

  describe('sendMail', () => {
    it('인증 이메일을 전송해야 함', async () => {
      jest.spyOn(redisService, 'set').mockResolvedValue(undefined);
      jest.spyOn(emailService, 'sendEmailVerificationCode').mockResolvedValue(true);

      const result = await authService.sendMail('test@example.com');
      expect(result).toBe(true);
    });
  });

  describe('verifyEmail', () => {
    it('이메일 인증에 성공해야 함', async () => {
      jest.spyOn(redisService, 'get').mockResolvedValue(123456);
      jest.spyOn(redisService, 'del').mockResolvedValue(undefined);

      const result = await authService.verifyEmail('test@example.com', 123456);
      expect(result).toBe(true);
    });

    it('인증 코드가 틀리면 에러를 던져야 함', async () => {
      jest.spyOn(redisService, 'get').mockResolvedValue(123456);

      await expect(authService.verifyEmail('test@example.com', 654321)).rejects.toThrow(BadRequestException);
    });
  });

  describe('signUp', () => {
    it('이미 사용 중인 이메일이면 ConflictException을 던져야 함', async () => {
      const signUpDto: SignUpDto = {
        email: 'test@gmail.com',
        password: 'password',
        passwordConfirm: 'password',
        nickname: 'testnickname',
      };
      jest.spyOn(userService, 'findByEmail').mockResolvedValue({ id: 1, email: 'test@gmail.com' } as User);

      await expect(authService.signUp(signUpDto)).rejects.toThrow(ConflictException);
    });

    it('새 사용자를 성공적으로 등록해야 함', async () => {
      const signUpDto: SignUpDto = {
        email: 'test@gmail.com',
        password: 'password',
        passwordConfirm: 'password',
        nickname: 'testnickname',
      };
      jest.spyOn(userService, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(configService, 'get').mockReturnValue('10');
      (bcrypt.hash as jest.Mock).mockImplementation(async () => 'hashedpassword');
      jest.spyOn(userRepository, 'save').mockResolvedValue({
        id: 1,
        email: 'test@gmail.com',
        password: 'hashedpassword',
        nickname: 'testnickname',
        createdAt: new Date(),
        updatedAt: new Date(),
        bio: null,
        image: null,
        deletedAt: null,
        refreshToken: null,
        comments: [],
        boards: [],
        members: [],
        assignee: [],
      });

      const result = await authService.signUp(signUpDto);
      expect(result).toEqual({
        id: 1,
        email: 'test@gmail.com',
        nickname: 'testnickname',
        bio: null,
        image: null,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        deletedAt: null,
        refreshToken: null,
        comments: [],
        boards: [],
        members: [],
        assignee: [],
      });
    });
  });

  describe('signIn', () => {
    it('이미 로그인한 경우 BadRequestException을 던져야 함', async () => {
      jest.spyOn(tokenRepository, 'findOneBy').mockResolvedValue({ userId: 1, token: 'existingToken' } as RefreshToken);

      await expect(authService.signIn(1, 'test@gmail.com')).rejects.toThrow(BadRequestException);
    });

    it('로그인 성공 시 토큰을 발급해야 함', async () => {
      jest.spyOn(tokenRepository, 'findOneBy').mockResolvedValue(null);
      jest
        .spyOn(authService, 'issueTokens')
        .mockResolvedValue({ accessToken: 'accessToken', refreshToken: 'refreshToken' });

      const result = await authService.signIn(1, 'test@gmail.com');
      expect(result).toEqual({ accessToken: 'accessToken', refreshToken: 'refreshToken' });
    });
  });

  describe('signOut', () => {
    it('로그인 기록이 없는 경우 NotFoundException을 던져야 함', async () => {
      jest.spyOn(tokenRepository, 'findOneBy').mockResolvedValue(null);

      await expect(authService.signOut(1)).rejects.toThrow(NotFoundException);
    });

    it('로그아웃 성공 시 토큰을 삭제해야 함', async () => {
      jest.spyOn(tokenRepository, 'findOneBy').mockResolvedValue({ userId: 1, token: 'existingToken' } as RefreshToken);
      jest.spyOn(tokenRepository, 'update').mockResolvedValue(undefined);

      await authService.signOut(1);
      expect(tokenRepository.update).toHaveBeenCalledWith({ userId: 1 }, { token: null });
    });
  });

  describe('renewTokens', () => {
    it('로그인 기록이 없는 경우 NotFoundException을 던져야 함', async () => {
      jest.spyOn(tokenRepository, 'findOneBy').mockResolvedValue(null);

      await expect(authService.renewTokens(1, 'test@gmail.com')).rejects.toThrow(NotFoundException);
    });

    it('토큰 갱신에 성공해야 함', async () => {
      jest.spyOn(tokenRepository, 'findOneBy').mockResolvedValue({ userId: 1, token: 'existingToken' } as RefreshToken);
      jest
        .spyOn(authService, 'issueTokens')
        .mockResolvedValue({ accessToken: 'newAccessToken', refreshToken: 'newRefreshToken' });

      const result = await authService.renewTokens(1, 'test@gmail.com');
      expect(result).toEqual({ accessToken: 'newAccessToken', refreshToken: 'newRefreshToken' });
    });
  });

  describe('validateUser', () => {
    it('사용자 인증에 성공해야 함', async () => {
      const signInDto: SignInDto = { email: 'test@gmail.com', password: 'password', nickname: 'testnickname' };
      const user = { id: 1, email: 'test@gmail.com', password: 'hashedpassword' } as User;

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockImplementation(async () => true);

      const result = await authService.validateUser(signInDto);
      expect(result).toEqual({ id: 1, email: 'test@gmail.com' });
    });

    it('잘못된 비밀번호일 경우 null을 반환해야 함', async () => {
      const signInDto: SignInDto = { email: 'test@gmail.com', password: 'password', nickname: 'testnickname' };
      const user = { id: 1, email: 'test@gmail.com', password: 'hashedpassword' } as User;

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockImplementation(async () => false);

      const result = await authService.validateUser(signInDto);
      expect(result).toBeNull();
    });
  });
});
