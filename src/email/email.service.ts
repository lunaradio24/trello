// src/email/email.service.ts

import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransporter } from 'src/utils/email.util';
import * as crypto from 'crypto';
import { createRedisClient } from 'src/utils/redis.util';
import { Redis } from '@upstash/redis';
import { sign } from 'jsonwebtoken';

@Injectable()
export class EmailService {
  private transporter: any;
  private redis: Redis;
  private invitationKey: string;

  constructor(private readonly configService: ConfigService) {
    const emailUser = this.configService.get('EMAIL_USER');
    const emailPass = this.configService.get('EMAIL_PASS');
    this.transporter = createTransporter(emailUser, emailPass);

    const redisUrl = this.configService.get('REDIS_HOST');
    const redisToken = this.configService.get('REDIS_TOKEN');
    this.invitationKey = this.configService.get('JWT_INVITATION_KEY');
    this.redis = createRedisClient(redisUrl, redisToken);
  }

  async sendEmailVerificationCode(email: string): Promise<string> {
    const verificationCode = crypto.randomBytes(3).toString('hex');
    const mailOptions = {
      from: this.configService.get('EMAIL_USER'),
      to: email,
      subject: '회원가입 이메일 인증번호입니다.',
      text: `${verificationCode} 인증번호를 회원가입 창에서 입력해주세요`,
    };

    await this.transporter.sendMail(mailOptions);
    return verificationCode;
  }

  async sendEmailVerificationLink(email: string, boardId: number, userId: number): Promise<string> {
    if (!email) {
      throw new Error('이메일 주소가 정의되지 않았습니다.');
    }
    const payload = { userId };
    const token = sign(payload, this.invitationKey);
    const clientUrl = this.configService.get('CLIENT_URL'); // CLIENT_URL 환경 변수에서 가져오기

    const linkMailOptions = {
      from: this.configService.get('EMAIL_USER'),
      to: email,
      subject: ' 보드 초대 인증링크입니다.',
      html: `<p><a href="${clientUrl}/boards/${boardId}/accept-invitation?token=${token}">여기</a>를 클릭해주세요.
  해당 인증은 9시간이 지나면 폐기됩니다.</p>`,
    };

    await this.transporter.sendMail(linkMailOptions);

    // 토큰을 Redis에 저장 (TTL을 9시간으로 설정)
    await this.redis.set(`email_verification_token_${token}`, email, { ex: 9 * 60 * 60 });

    return token; // 생성된 토큰 반환
  }

  async storeTokenData(token: string, boardId: number, userId: number, email: string) {
    const data = JSON.stringify({ boardId, userId, email });
    await this.redis.set(`email_verification_token_${token}`, JSON.stringify(data), { ex: 9 * 60 * 60 });
  }

  async verifyTokenData(
    token: string,
  ): Promise<{ boardId: number; userId: number; email: string } | { message: string }> {
    const data: string | null = await this.redis.get(`email_verification_token_${token}`);

    if (!data) {
      return { message: '토큰이 유효하지 않거나 만료되었습니다.' }; // 토큰이 유효하지 않거나 만료된 경우
    }

    await this.redis.del(`email_verification_token_${token}`);
    const parsedData = JSON.parse(data);

    // 데이터가 유효한지 확인
    if (!parsedData.boardId || !parsedData.userId || !parsedData.email) {
      return { message: '토큰 데이터가 올바르지 않습니다.' };
    }

    return parsedData; // 유효한 경우 데이터 반환
  }
}
