import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateMeDto {
  /**
   * 비밀번호
   * @example "example1234!"
   */
  @IsString()
  @IsNotEmpty({ message: '비밀번호를 입력해주세요.' })
  readonly password: string;

  /**
   * 닉네임
   * @example "코난"
   */
  @IsString()
  @IsOptional()
  readonly nickname?: string;

  /**
   * 자기소개
   * @example "내 이름은 탐정, 코난이죠"
   */
  @IsString()
  @IsOptional()
  readonly bio?: string;

  /**
   * 프로필 이미지
   * @example "conan.png"
   */
  @IsString()
  @IsOptional()
  @IsUrl({ allow_underscores: true, allow_trailing_dot: true, allow_protocol_relative_urls: true })
  readonly image?: string;
}
