import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { compare, hash } from 'bcrypt';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { UserService } from 'src/user/user.service';
import { InjectRepository } from '@nestjs/typeorm';
import { sign } from 'jsonwebtoken';
import { RefreshToken } from './entities/refresh-token.entity';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { EmailService } from '../email/email.service';
import { generateRandomNumber } from '../utils/generate-random-code.util';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly tokenRepository: Repository<RefreshToken>,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly redisService: RedisService,
  ) {}

  async sendMail(email: string) {
    // 이메일 인증코드 생성
    const code = generateRandomNumber();
    // redis에 인증코드 저장
    await this.redisService.set(email, code);
    // 이메일 전송
    const isSuccess = await this.emailService.sendEmailVerificationCode(email, code);
    return isSuccess ?? false;
  }

  async verifyEmail(email: string, code: number) {
    // redis에 저장된 이메일 인증번호 가져와서 입력받은 숫자와 비교
    const savedCode = await this.redisService.get(email);
    if (!savedCode || savedCode !== code) {
      throw new BadRequestException('잘못된 인증번호입니다.');
    }

    // redis에 저장된 이메일 인증번호 삭제
    await this.redisService.del(email);
    return true;
  }

  async signUp(signUpDto: SignUpDto) {
    const { email, password, nickname } = signUpDto;

    // 이메일 중복 여부 확인
    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('이미 해당 이메일로 가입된 사용자가 있습니다!');
    }

    // 비밀번호 해싱
    const hashRounds = Number(this.configService.get('HASH_ROUNDS'));
    const hashedPassword = await hash(password, hashRounds);

    // 유저 등록
    const newUser = await this.userRepository.save({
      email,
      password: hashedPassword,
      nickname,
    });

    // 비밀번호 제외 후 반환
    const { password: _, ...newUserWithoutPassword } = newUser;
    return newUserWithoutPassword;
  }

  async signIn(userId: number, email: string) {
    const payload = { id: userId, email };
    // 로그인 여부 확인
    const loginRecord = await this.tokenRepository.findOneBy({ userId });
    if (loginRecord && loginRecord.token) {
      throw new BadRequestException('이미 로그인 하셨습니다.');
    }

    // 토큰 발급
    const tokens = await this.issueTokens(payload);
    return tokens;
  }

  async signOut(userId: number) {
    // 로그인 여부 확인
    const loginRecord = await this.tokenRepository.findOneBy({ userId });
    if (!loginRecord) {
      throw new NotFoundException('로그인한 기록이 없습니다.');
    }
    if (!loginRecord.token) {
      throw new BadRequestException('이미 로그아웃 되었습니다.');
    }
    // DB에서 Refresh Token 삭제(soft delete)
    await this.tokenRepository.update({ userId }, { token: null });
  }

  async renewTokens(userId: number, email: string) {
    // 로그인 여부 확인
    const loginRecord = await this.tokenRepository.findOneBy({ userId });
    if (!loginRecord) {
      throw new NotFoundException('로그인한 기록이 없습니다.');
    }
    if (!loginRecord.token) {
      throw new BadRequestException('로그인 상태가 아닙니다.');
    }
    // 토큰 재발급
    const payload = { id: userId, email };
    const tokens = await this.issueTokens(payload);
    return tokens;
  }

  async validateUser(signInDto: SignInDto) {
    const { email, password } = signInDto;

    // 등록된 이메일인지 확인
    const user = await this.userRepository.findOne({
      select: ['id', 'email', 'password'],
      where: { email },
    });

    if (!user) return null;

    // 입력한 비밀번호가 맞는 비밀번호인지 확인
    const isPasswordMatched = await compare(password, user.password);

    if (isPasswordMatched) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return null;
  }

  async issueTokens(payload: JwtPayload) {
    const userId = payload.id;

    // Access Token, Refresh Token 생성
    const accessToken = sign(payload, this.configService.get('ACCESS_TOKEN_SECRET_KEY'));
    const refreshToken = sign(payload, this.configService.get('REFRESH_TOKEN_SECRET_KEY'));

    // Refresh Token Hashing 후 DB에 저장
    const hashRounds = Number(this.configService.get('HASH_ROUNDS'));
    const hashedRefreshToken = await hash(refreshToken, hashRounds);

    // DB에 해당 유저의 Refresh Token 데이터가 있는지 확인
    const loginRecord = await this.tokenRepository.findOne({ where: { userId } });

    // 없으면 데이터 삽입
    if (!loginRecord) {
      await this.tokenRepository.insert({
        userId,
        token: hashedRefreshToken,
      });
    }
    // 있으면 갱신
    else {
      await this.tokenRepository.update({ userId }, { token: hashedRefreshToken });
    }

    // Access Token, Refresh Token 반환
    return { accessToken, refreshToken };
  }
}
