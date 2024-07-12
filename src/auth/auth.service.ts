import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource, Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { compare, hash } from 'bcrypt';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { UserService } from 'src/user/user.service';
import { InjectRepository } from '@nestjs/typeorm';
import { sign } from 'jsonwebtoken';
import { RefreshToken } from './entities/refresh-token.entity';
// import { JwtPayload } from './constants/jwt-payload.interface';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { ConfigService } from '@nestjs/config';
import { redisStrategy } from './strategies/redis.strategy';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private transporter;
  constructor(
    private readonly redisService: redisStrategy,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly tokenRepository: Repository<RefreshToken>,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private dataSource: DataSource,
  ) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      port: 587,
      host: 'smtp.gmail.com',
      secure: true,
      requireTLS: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendMail(to: string, subject: string, text: string) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent: ' + info.response);
    } catch (error) {
      console.error('Error sending email: ' + error);
    }
  }

  async sendVerificationEmail(email: string) {
    const verificationCode = crypto.randomBytes(16).toString('hex');
    await this.redisService.set(verificationCode, email, 'EX', 3600); // 1시간 동안 유효

    const subject = '이메일 인증';
    const text = `인증 번호: ${verificationCode}`;
    await this.sendMail(email, subject, text);
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
