import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateListDto {
  /**
   * 보드 ID
   * @example 1
   */
  @IsNumber()
  @IsNotEmpty({ message: '보드의 Id를 입력해주세요.' })
  boardId: number;

  /**
   * 리스트 이름
   * @example "리스트 이름"
   */
  @IsString()
  @IsNotEmpty({ message: '제목을 입력해주세요.' })
  title: string;
}
