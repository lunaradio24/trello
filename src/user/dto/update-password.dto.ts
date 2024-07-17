import { IsNotEmpty, IsString, Validate } from 'class-validator';
import { IsPasswordMatchingConstraint } from '../../user/decorators/password-match.decorator';

export class UpdatePasswordDto {
  /**
   * 기존 비밀번호
   * @example "example1234!"
   */
  @IsString()
  @IsNotEmpty({ message: '기존 비밀번호를 입력해주세요.' })
  readonly currPassword: string;

  /**
   * 새 비밀번호
   * @example "example123456!"
   */
  @IsString()
  @IsNotEmpty({ message: '새 비밀번호를 입력해주세요.' })
  readonly newPassword: string;

  /**
   * 새 비밀번호 확인
   * @example "example123456!"
   */
  @IsString()
  @IsNotEmpty({ message: '새 비밀번호 확인을 입력해주세요.' })
  @Validate(IsPasswordMatchingConstraint)
  readonly newPasswordConfirm: string;
}
