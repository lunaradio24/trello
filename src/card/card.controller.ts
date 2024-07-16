import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CardService } from './card.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { MoveCardDto } from './dto/move-card.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Cards')
@Controller('cards')
@UseGuards(AccessTokenGuard)
export class CardController {
  constructor(private readonly cardService: CardService) {}

  /** 카드 생성 */
  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  async createCard(@Body() createCardDto: CreateCardDto) {
    const card = await this.cardService.createCard(createCardDto);
    return {
      status: HttpStatus.OK,
      message: '카드 생성에 성공했습니다.',
      data: card,
    };
  }

  /** 카드 상세 조회 */
  @Get(':cardId')
  async getCardById(@Param('cardId', ParseIntPipe) cardId: number) {
    const getCard = await this.cardService.getCardById(cardId);
    return {
      status: HttpStatus.OK,
      message: '카드 상세 조회에 성공했습니다.',
      data: getCard,
    };
  }

  /** 카드 수정 */
  @Patch(':cardId')
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateCardById(@Param('cardId', ParseIntPipe) cardId: number, @Body() updateCardDto: UpdateCardDto) {
    const updateCard = await this.cardService.updateCardById(cardId, updateCardDto);
    return {
      status: HttpStatus.OK,
      message: '카드 수정에 성공했습니다.',
      data: updateCard,
    };
  }

  // /**카드 담당자 추가 */
  // @Post(':cardId/assignees/:assigneeId')
  // async addAssignee(
  //   @Param('cardId', ParseIntPipe) cardId: number,
  //   @Param('assigneeId', ParseIntPipe) assIgneeId: number,
  // ) {
  //   const { cardAssignee, user } = await this.cardService.addAssignee(cardId, assIgneeId);
  //   return {
  //     status: HttpStatus.OK,
  //     message: '카드 담당자를 추가했습니다.',
  //     data: {
  //       cardAssignee,
  //       user: {
  //         id: user.id,
  //         email: user.email,
  //       },
  //     },
  //   };
  // }

  // /**카드 담당자 삭제 */
  // @Delete(':cardId/assignees/:assigneeId')
  // async removeAssignee(
  //   @Param('cardId', ParseIntPipe) cardId: number,
  //   @Param('assigneeId', ParseIntPipe) assigneeId: number,
  // ) {
  //   await this.cardService.removeAssignee(cardId, assigneeId);
  //   return {
  //     status: HttpStatus.OK,
  //     message: '카드 담당자를 삭제했습니다.',
  //   };
  // }

  /** 카드 담당자 추가/삭제 */
  @Post(':cardId/assignees/:assigneeId')
  async toggleAssignee(
    @Param('cardId', ParseIntPipe) cardId: number,
    @Param('assigneeId', ParseIntPipe) assigneeId: number,
  ) {
    const result = await this.cardService.toggleAssignee(cardId, assigneeId);
    if (result.removed) {
      return {
        status: HttpStatus.OK,
        message: '카드 어싸이니 삭제에 성공했습니다.',
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            image: result.user.image,
          },
        },
      };
    } else {
      return {
        status: HttpStatus.OK,
        message: '카드 어싸이니 추가에 성공했습니다.',
        data: {
          cardAssignee: result.cardAssignee,
          user: {
            id: result.user.id,
            email: result.user.email,
            image: result.user.image,
          },
        },
      };
    }
  }

  /** 카드 이동 */
  @Patch(':cardId/move')
  @UsePipes(new ValidationPipe({ transform: true }))
  async moveCardById(@Param('cardId', ParseIntPipe) cardId: number, @Body() moveCardDto: MoveCardDto) {
    const moveCard = await this.cardService.moveCardById(cardId, moveCardDto);
    return {
      status: HttpStatus.OK,
      message: '카드 이동에 성공했습니다.',
      data: moveCard,
    };
  }

  /** 카드 삭제 */
  @Delete(':cardId')
  async removeCardById(@Param('cardId', ParseIntPipe) cardId: number) {
    const removeCard = await this.cardService.removeCardById(cardId);
    return {
      status: HttpStatus.OK,
      message: '카드 삭제에 성공했습니다.',
      data: removeCard,
    };
  }
}
