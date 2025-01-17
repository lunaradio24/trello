import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransporter } from '../utils/email.util';
import { createRedisClient } from '../utils/redis.util';
import { Redis } from '@upstash/redis';
import { sign } from 'jsonwebtoken';
import { EXPIRATION_TIME_IN_SECONDS } from './constants/email.constants';

@Injectable()
export class EmailService {
  private transporter: any;
  private redis: Redis;
  private invitationKey: string;

  constructor(private readonly configService: ConfigService) {
    const emailUser = this.configService.get('EMAIL_USERNAME');
    const emailPass = this.configService.get('EMAIL_PASSWORD');
    this.transporter = createTransporter(emailUser, emailPass);

    const redisUrl = this.configService.get('REDIS_HOST');
    const redisToken = this.configService.get('REDIS_TOKEN');
    this.invitationKey = this.configService.get('JWT_INVITATION_KEY');
    this.redis = createRedisClient(redisUrl, redisToken);
  }

  async sendEmailVerificationCode(email: string, code: number): Promise<boolean> {
    const mailOptions = {
      from: this.configService.get('EMAIL_USER'),
      to: email,
      subject: '회원가입 이메일 인증번호입니다.',
      text: `${code} 인증번호를 회원가입 창에서 입력해주세요`,
    };

    await this.transporter.sendMail(mailOptions);
    return true;
  }

  async sendBoardInvitationLink(email: string, boardId: number, userId: number): Promise<string> {
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
      html: `<p><a href="${clientUrl}/boards/${boardId}/invite/accept?token=${token}">여기</a>를 클릭해주세요.
  해당 인증은 ${EXPIRATION_TIME_IN_SECONDS / 3600}시간이 지나면 폐기됩니다.</p>`, //32400 / 3600 = 9
    };

    await this.transporter.sendMail(linkMailOptions);

    // 토큰을 Redis에 저장 (TTL을 9시간으로 설정)
    await this.storeTokenData(token, boardId, userId, email);

    return token; // 생성된 토큰 반환
  }

  storeTokenData = async (token: string, boardId: number, userId: number, email: string) => {
    const data = JSON.stringify({ boardId, userId, email });
    await this.redis.set(`board_invitation_token_${token}`, data, { ex: EXPIRATION_TIME_IN_SECONDS });
  };

  async verifyTokenData(
    token: string,
  ): Promise<{ boardId: number; userId: number; email: string } | { message: string }> {
    const data: string | null = await this.redis.get(`board_invitation_token_${token}`);

    if (!data) {
      return { message: '토큰이 유효하지 않거나 만료되었습니다.' }; // 토큰이 유효하지 않거나 만료된 경우
    }

    try {
      let parsedData: { boardId: number; email: string; userId: number };
      // 데이터가 문자열이면 JSON 파싱
      if (typeof data === 'string') {
        console.log(`Retrieved data: ${data}`); // 데이터 로그 추가
        parsedData = JSON.parse(data);
      } else if (typeof data === 'object') {
        parsedData = data; // 이미 객체인 경우 그대로 사용
      } else {
        parsedData = JSON.parse(JSON.stringify(data));
      }

      // 데이터가 유효한지 확인
      if (!parsedData.boardId || !parsedData.userId || !parsedData.email) {
        return { message: '토큰 데이터가 올바르지 않습니다.' };
      }

      await this.redis.del(`board_invitation_token_${token}`);
      return parsedData; // 유효한 경우 데이터 반환
    } catch (error) {
      console.error(`Failed to parse token data: ${error.message}`);
      return { message: '토큰 데이터가 올바르지 않습니다.' };
    }
  }
}
