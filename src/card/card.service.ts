import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
    const list = await this.cardRepository.findOne({ where: { id: listId } });

    //리스트 찾기
    if (!list) {
      throw new NotFoundException('해당 리스트가 없습니다.');
    }

    //카드 생성 제한
    const cardCount = await this.cardRepository.count({ where: { list: { id: listId } } });
    if (cardCount >= 12) {
      throw new Error('카드 생성 제한을 초과했습니다.');
    }

    // 포지션 값 계산
    const lastCard = await this.cardRepository.findOne({
      where: { list: { id: listId } },
      order: { position: 'DESC' },
    });
    const position = lastCard ? lastCard.position * 2 : 1024;

    const card = this.cardRepository.create({
      list,
      title: title,
      description: null,
      position,
    });

    return this.cardRepository.save(card);
  }

  //카드 상세 조회 API
  async getCardById(id: number): Promise<Card> {
    const card = await this.cardRepository.findOne({
      where: { id },
      relations: ['checklists', 'attachments', 'cardAssignees', 'comments'],
      order: { position: 'DESC' },
    });
    if (!card) {
      throw new NotFoundException('해당 카드를 찾을 수 없습니다.');
    }
    return card;
  }

  // 카드 업데이트 API
  async updateCardById(id: number, updateCardDto: UpdateCardDto): Promise<Card> {
    const card = await this.cardRepository.update(id, updateCardDto);
    // 카드 존재 확인
    if (!card) {
      throw new NotFoundException('해당 카드를 찾을 수 없습니다.');
    }

    return this.getCardById(id);
  }

  // 카드 담당자 추가 API
  // TODO: 매소드 이름 변경(update -> add or create), 배열이 아니라 한 명씩 추가
  // TODO: create-card.dto, update-card-dto도 그에 맞춰 변경
  async updateAssignees(cardId: number, assigneeId: number[]): Promise<void> {
    // 기존 Assignee 삭제
    await this.cardAssigneeRepository.delete({ cardId });

    // 새로운 Assignee 추가
    const cardAssignees = assigneeId.map((assigneeId) => ({
      cardId,
      assigneeId,
    }));
    await this.cardAssigneeRepository.save(cardAssignees);
  }

  // 카드 담당자 삭제 API
  // TODO: 한 명씩 삭제

  //카드 이동 API
  async moveCardById(cardId: number, moveCardDto: MoveCardDto): Promise<Card> {
    const { listId: targetListId, targetCardId, position } = moveCardDto;

    const card = await this.cardRepository.findOne({ where: { id: cardId } });
    if (!card) {
      throw new NotFoundException('해당 카드를 찾을 수 없습니다.');
    }

    const targetList = await this.listRepository.findOne({ where: { id: targetListId } });
    if (!targetList) {
      throw new NotFoundException('옮길 리스트를 찾을 수 없습니다.');
    }

    //오름차순으로 가져와 포지션 계산
    const targetListCards = await this.cardRepository.find({
      where: { listId: targetListId },
      order: { position: 'ASC' },
    });

    let newPosition: number;

    if (targetListCards.length === 0) {
      //옮길 리스트에 다른 카드가 없다면 새 카드의 포지션 값을 1024로 설정
      newPosition = 1024;
    } else {
      const targetCardIndex = targetListCards.findIndex((c) => c.id === targetCardId);

      if (targetCardIndex < 0) {
        throw new BadRequestException('카드가 이동할 곳을 명확히 입력해주세요.');
      }

      const targetCard = targetListCards[targetCardIndex];

      //카드가 이동할 곳이 타켓 카드의 위일 때
      if (position === 'before') {
        const prevCard = targetListCards[targetCardIndex - 1];

        if (prevCard) {
          newPosition = (prevCard.position + targetCard.position) / 2;
        } else {
          newPosition = targetCard.position / 2;
        }
        //카드가 이동할 곳이 타켓 카드의 아래일 때
      } else if (position === 'after') {
        const nextCard = targetListCards[targetCardIndex + 1];

        if (nextCard) {
          newPosition = (targetCard.position + nextCard.position) / 2;
        } else {
          newPosition = targetCard.position * 2;
        }
      } else {
        throw new Error('포지션 값이 올바르지 않습니다.');
      }
    }

    /**
     * 소수점이 0.2미만으로 떨어지면 position 새로고침
     * 인덱스에 따라 1024의 2의 제곱으로 생성
     */
    if (newPosition % 1 !== 0 && newPosition % 1 < 0.2) {
      // 포지션 값들을 내림차순으로 정렬
      targetListCards.sort((a, b) => b.position - a.position);
      const factor = 1024;
      for (let i = 0; i < targetListCards.length; i++) {
        targetListCards[i].position = factor * Math.pow(2, i);
      }
      await this.cardRepository.save(targetListCards);
      newPosition = factor * Math.pow(2, targetListCards.length);
    }

    // 카드의 listId와 position 값 업데이트
    card.list = targetList;
    card.position = newPosition;
    return this.cardRepository.save(card);
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
