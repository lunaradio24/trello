import { IsEmail, IsNotEmpty, IsNumber } from 'class-validator';

export class InviteBoardDto {
  @IsEmail()
  @IsNotEmpty({ message: '이메일을 입력해주세요.' })
  readonly email: string;
}
