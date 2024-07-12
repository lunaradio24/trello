import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransporter } from 'src/utils/email.util';
import { generateRandomNumber } from 'src/utils/generate-random-code.util';

@Injectable()
export class EmailService {
  private transporter: any;

  constructor(private readonly configService: ConfigService) {
    const emailUser = this.configService.get('EMAIL_USER');
    const emailPass = this.configService.get('EMAIL_PASS');
    this.transporter = createTransporter(emailUser, emailPass);
  }

  async sendEmailVerificationCode(email: string): Promise<boolean> {
    const verificationCode = generateRandomNumber();
    const mailOptions = {
      from: this.configService.get('EMAIL_USER'),
      to: email,
      subject: '회원가입 이메일 인증번호입니다.',
      text: `${verificationCode} 인증번호를 회원가입 창에서 입력해주세요`,
    };

    await this.transporter.sendMail(mailOptions);
    return true;
  }
}
