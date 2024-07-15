import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { SignUpDto } from './dto/sign-up.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { AuthService } from './auth.service';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { ApiTags } from '@nestjs/swagger';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { SendEmailDto } from './dto/send-email.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  emailService: any;
  constructor(private readonly authService: AuthService) {}

  /** 회원가입 */
  @Post('sign-up')
  async signUp(@Body() signUpDto: SignUpDto) {
    const newUser = await this.authService.signUp(signUpDto);
    return {
      message: '회원가입을 완료했습니다.',
      data: newUser,
    };
  }

  /** 로그인 */
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

  /** 로그아웃 */
  @Post('sign-out')
  @UseGuards(RefreshTokenGuard)
  async signOut(@Request() req: any) {
    await this.authService.signOut(req.user.id);
    return {
      message: '로그아웃에 성공했습니다.',
    };
  }

  /** 토큰 재발급 */
  @Post('renew-tokens')
  @UseGuards(RefreshTokenGuard)
  async renewTokens(@Request() req: any) {
    const tokens = await this.authService.renewTokens(req.user.id, req.user.email);
    return {
      message: '토큰 재발급에 성공했습니다.',
      data: tokens,
    };
  }

  /** 이메일 인증 코드 발송 */
  @Post('send-email')
  async sendEmail(@Body() sendEmailDto: SendEmailDto) {
    const isSuccess = await this.authService.sendMail(sendEmailDto.email);
    return {
      message: '이메일 전송에 성공했습니다.',
      data: { isSuccess },
    };
  }

  /** 이메일 인증 */
  @Post('verify-email')
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    const isVerifiedCode = await this.authService.verifyEmail(verifyEmailDto.email, verifyEmailDto.code);
    return {
      message: '이메일 인증에 성공했습니다.',
      data: { isVerifiedCode },
    };
  }
}
