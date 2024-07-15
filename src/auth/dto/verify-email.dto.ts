import { IsEmail, IsNotEmpty, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class VerifyEmail {
  @IsEmail()
  @IsNotEmpty({ message: '이메일을 입력해주세요.' })
  readonly email: string;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty({ message: '인증 코드를 입력해주세요.' })
  readonly code: number;
}
