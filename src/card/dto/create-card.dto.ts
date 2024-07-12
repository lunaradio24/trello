import { isNotEmpty } from "class-validator";
import { isString } from "class-validator";

export class CreateCardDto {
    @isString()
    @isNotEmpty({ message: '제목을 입력해주세요.'})
    readonly title: string;

    @isString()
    readonly listId: number;

} 
