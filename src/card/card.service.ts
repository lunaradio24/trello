import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Card } from './entities/card.entity';
import { Repository } from 'typeorm';
import { CardAssignee } from './entities/card_assignee.entity';

@Injectable()
export class CardService {
  constructor(
    @InjectRepository(Card)
    private cardRepository: Repository<Card>,
    @InjectRepository(CardAssignee)
    private cardAssigneeRepository: Repository<CardAssignee>,
  ) {}

  async createCard(createCardDto: CreateCardDto): Promise<Card> {
    const { title, listId } = createCardDto;
    const list = await this.cardRepository.findOneBy({ listId });

    if (!list) {
      throw new NotFoundException('해당 리스트가 없습니다.');
    }
    const newCard = await this.cardRepository.findOne({
      where: { listId },
      order: { position: 'DESC' },
    });
    const position = newCard ? newCard.position * 2 : 1024;

    const card = this.cardRepository.create({
      listId: list.id,
      title: title,
      position,
    });

    return this.cardRepository.save(card);
  }

  async getCardById(id: number): Promise<Card> {
    const card = await this.cardRepository.findOne({
      where: { id },
      relations: ['checklists', 'attachments', 'cardAssignees', 'comments'],
    });
    if (!card) {
      throw new NotFoundException('해당 카드를 찾을 수 없습니다.');
    }
    return card;
  }

  async updateCardById(id: number, updateCardDto: UpdateCardDto): Promise<Card> {
    const { assigneeId, ...cardData } = updateCardDto;

    // 카드 업데이트
    const card = await this.cardRepository.update(id, cardData);

    // 카드 존재 확인
    if (!card) {
      throw new NotFoundException('해당 카드를 찾을 수 없습니다.');
    }

    // Assignee 업데이트
    if (assigneeId) {
      await this.updateAssignees(id, assigneeId);
    }

    return this.getCardById(id);
  }

  private async updateAssignees(cardId: number, assigneeId: number[]): Promise<void> {
    // 기존 Assignee 삭제
    await this.cardAssigneeRepository.delete({ cardId });

    // 새로운 Assignee 추가
    const cardAssignees = assigneeId.map((assigneeId) => ({
      cardId,
      assigneeId,
    }));
    await this.cardAssigneeRepository.save(cardAssignees);
  }

  // moveCardById(id: number) {
  //   return `This action returns a #${id} card`;
  //   1024*2 증가
  //  롤백 로직 소수점 아래 자리가 7자리 이하로 떨어지면 롤백
  // }

  async removeCardById(id: number): Promise<void> {
    const card = await this.cardRepository.findOneBy({ id });
    if (!card) {
      throw new NotFoundException('해당 카드를 찾을 수 없습니다.');
    }

    await this.cardRepository.softDelete({ id });
  }

  // board 상세조회 시 cards 가져오기
  async findAllBoards(listId: number) {
    const cards = await this.cardRepository.find({
      where: {
        list: {
          id: listId,
        },
      },
    });
    return cards;
  }
}
