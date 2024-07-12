import { PickType } from "@nestjs/mapped-types";
import {  IsInt,IsNotEmpty,IsString } from "class-validator";
import { Card } from "../entities/card.entity";

export class CreateCardDto extends PickType(Card, ['listId','title']){
    @IsInt()
    @IsNotEmpty()
    readonly listId: number;
    
    @IsString()
    @IsNotEmpty({ message: '제목을 입력해주세요.'})
    readonly title: string;
} 
