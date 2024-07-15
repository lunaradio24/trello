import { IsNotEmpty, IsOptional, IsString, IsUrl, Validate } from 'class-validator';
import { IsPasswordMatchingConstraint } from '../../auth/password-match.decorator';

export class UpdateMeDto {
  @IsString()
  @IsNotEmpty({ message: '비밀번호를 입력해주세요.' })
  readonly password: string;

  // @IsString()
  // @IsNotEmpty({ message: '비밀번호 확인을 입력해주세요.' })
  // @Validate(IsPasswordMatchingConstraint, { message: '비밀번호와 비밀번호 확인이 일치하지 않습니다.' })
  // readonly passwordConfirm: string;

  @IsString()
  @IsOptional()
  // @IsNotEmpty({ message: '이름을 입력해주세요.' })
  readonly nickname?: string;

  @IsString()
  @IsOptional()
  // @IsNotEmpty({ message: '자기소개를 입력해주세요.' })
  readonly bio?: string;

  @IsString()
  @IsOptional()
  @IsUrl({ allow_underscores: true, allow_trailing_dot: true, allow_protocol_relative_urls: true })
  // @IsNotEmpty({ message: '프로필 사진을 입력해주세요.' })
  readonly image?: string;
}
