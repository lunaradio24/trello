import { IsEmail, IsNotEmpty, IsString, Validate } from 'class-validator';
import { IsPasswordMatchingConstraint } from '../password-match.decorator';
import { PickType } from '@nestjs/swagger';
import { User } from 'src/user/entities/user.entity';

export class SignUpDto extends PickType(User, ['email', 'password', 'nickname']) {
  /**
   * 이메일
   * @example "user@example.com"
   */
  @IsEmail()
  @IsNotEmpty({ message: '이메일을 입력해주세요.' })
  readonly email: string;

  /**
   * 비밀번호
   * @example "example1234!"
   */
  @IsString()
  @IsNotEmpty({ message: '비밀번호를 입력해주세요.' })
  readonly password: string;

  /**
   * 비밀번호 확인
   * @example "example1234!"
   */
  @IsString()
  @IsNotEmpty({ message: '비밀번호 확인을 입력해주세요.' })
  @Validate(IsPasswordMatchingConstraint)
  readonly passwordConfirm: string;

  /**
   * 닉네임
   * @example "닉네임"
   */
  @IsString()
  @IsNotEmpty({ message: '이름을 입력해주세요.' })
  readonly nickname: string;
}
