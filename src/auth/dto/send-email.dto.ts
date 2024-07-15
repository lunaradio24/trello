import { IsEmail, IsNotEmpty } from 'class-validator';

export class SendEmailDto {
  @IsEmail()
  @IsNotEmpty({ message: '이메일을 입력해주세요.' })
  readonly email: string;
}
