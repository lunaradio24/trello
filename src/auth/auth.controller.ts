import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { SignUpDto } from './dto/sign-up.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { AuthService } from './auth.service';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { SendEmailDto } from './dto/send-email.dto';

@Controller('auth')
export class AuthController {
  emailService: any;
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  async signUp(@Body() signUpDto: SignUpDto) {
    const newUser = await this.authService.signUp(signUpDto);
    return {
      message: '회원가입을 완료했습니다.',
      data: newUser,
    };
  }

  @Post('sign-in')
  @UseGuards(LocalAuthGuard)
  async signIn(@Request() req: any) {
    const { id: userId, email } = req.user;
    const tokens = await this.authService.signIn(userId, email);
    return {
      message: '로그인에 성공했습니다.',
      data: tokens,
    };
  }

  @Post('sign-out')
  @UseGuards(RefreshTokenGuard)
  async signOut(@Request() req: any) {
    await this.authService.signOut(req.user.id);
    return {
      message: '로그아웃에 성공했습니다.',
    };
  }

  @Post('renew-tokens')
  @UseGuards(RefreshTokenGuard)
  async renewTokens(@Request() req: any) {
    const tokens = await this.authService.renewTokens(req.user.id, req.user.email);
    return {
      message: '토큰 재발급에 성공했습니다.',
      data: tokens,
    };
  }

  @Post('send-email')
  async sendEmail(@Body() sendEmailDto: SendEmailDto) {
    const isSuccess = await this.authService.sendMail(sendEmailDto.email);
    return {
      message: '이메일 전송에 성공했습니다.',
      data: { isSuccess },
    };
  }

  @Post('verify-email')
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    const isVerifiedCode = await this.authService.verifyEmail(verifyEmailDto.email, verifyEmailDto.code);
    return {
      message: '이메일 인증에 성공했습니다.',
      data: { isVerifiedCode },
    };
  }
}
