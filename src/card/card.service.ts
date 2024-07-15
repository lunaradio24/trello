import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Card } from './entities/card.entity';
import { Repository } from 'typeorm';
import { CardAssignee } from './entities/card_assignee.entity';
import { MoveCardDto } from './dto/move-card.dto';
import { List } from 'src/list/entities/list.entity';

//레포지토리 가져오기
@Injectable()
export class CardService {
  constructor(
    @InjectRepository(Card)
    private cardRepository: Repository<Card>,
    @InjectRepository(CardAssignee)
    private cardAssigneeRepository: Repository<CardAssignee>,
    @InjectRepository(List)
    private listRepository: Repository<List>,
  ) {}

  //카드 생성 API
  async createCard(createCardDto: CreateCardDto): Promise<Card> {
    const { title, listId } = createCardDto;
    const list = await this.cardRepository.findOneBy({ listId });

    //리스트 찾기
    if (!list) {
      throw new NotFoundException('해당 리스트가 없습니다.');
    }

    //카드 생성 제한
    const cardCount = await this.cardRepository.count({ where: { listId } });
    if (cardCount >= 12) {
      throw new Error('카드 생성 제한을 초과했습니다.');
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

  //카드 상세 조회 API
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

  // 카드 업데이트 API
  async updateCardById(id: number, updateCardDto: UpdateCardDto): Promise<Card> {
    const { assigneeId, ...cardData } = updateCardDto;

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

  //카드 이동 API
  async moveCardById(cardId: number, moveCardDto: MoveCardDto): Promise<Card> {
    const { listId: targetListId } = moveCardDto;

    const card = await this.cardRepository.findOne({ where: { id: cardId } });
    if (!card) {
      throw new NotFoundException('해당 카드를 찾을 수 없습니다.');
    }

    const targetList = await this.listRepository.findOne({ where: { id: targetListId } });
    if (!targetList) {
      throw new NotFoundException('옮길 리스트를 찾을 수 없습니다.');
    }

    //내림차순으로 가져오기
    const targetListCards = await this.cardRepository.find({
      where: { listId: targetListId },
      order: { position: 'DESC' },
    });

    /**
     * 1.리스트에 카드가 없다면 1024
     * 2.리스트에 뒤에만 카드가 있다면 뒤의 카드 나누기 2
     * 3.리스트에 앞 뒤 카드 둘 다 있거나 뒤에 카드만 있다면 더해서 나누기 2
     */
    let newPosition: number;
    if (targetListCards.length === 0) {
      newPosition = 1024;
    } else if (targetListCards.length === 1) {
      const onlyCard = targetListCards[0];
      newPosition = onlyCard.position / 2;
    } else {
      const prevCard = targetListCards[targetListCards.length - 1];
      const nextCard = targetListCards[0];
      newPosition = (prevCard.position + nextCard.position) / 2;
    }

    /**
     * 소수점이 0.2미만으로 떨어지면 position 새로고침
     * 인덱스에 따라 1024의 2의 제곱으로 생성
     */
    if (newPosition % 1 < 0.2) {
      let factor = 1024;
      for (let i = 0; i < targetListCards.length; i++) {
        targetListCards[i].position = factor * Math.pow(2, i);
      }
      await this.cardRepository.save(targetListCards);
      newPosition = factor * Math.pow(2, targetListCards.length);
    }

    // 새로운 카드 생성 및 기존 카드 삭제
    const newCard = this.cardRepository.create({ ...card, listId: targetListId, position: newPosition });
    await this.cardRepository.remove(card);
    return this.cardRepository.save(newCard);
  }

  //카드 소프트 딜리트
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
