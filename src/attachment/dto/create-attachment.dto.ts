import { IsInt, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateAttachmentDto {
  /**
   * 카드번호
   * @example "3"
   */
  @IsString()
  @IsNotEmpty({ message: '카드번호를 입력해주세요.' })
  readonly cardId: string;

  /**
   * 파일 이름
   * @example "conan.txt"
   */
  @IsString()
  fileName: string;

  /**
   * 파일 주소
   * @example "conan.txt"
   */
  @IsString()
  fileUrl: string;
}
