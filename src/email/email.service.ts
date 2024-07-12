// src/email/email.service.ts

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransporter } from 'src/utils/email.util';
import * as crypto from 'crypto';

@Injectable()
export class EmailService {
  private transporter: any;

  constructor(private readonly configService: ConfigService) {
    const emailUser = this.configService.get('EMAIL_USER');
    const emailPass = this.configService.get('EMAIL_PASS');
    this.transporter = createTransporter(emailUser, emailPass);
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
}
