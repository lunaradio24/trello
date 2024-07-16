import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Card } from './entities/card.entity';
import { Repository } from 'typeorm';
import { CardAssignee } from './entities/card-assignee.entity';
import { MoveCardDto } from './dto/move-card.dto';
import { List } from '../list/entities/list.entity';
import { User } from '../user/entities/user.entity';
import {
  INITIAL_POSITION,
  MAX_CARD_COUNT,
  POSITION_MULTIPLIER,
  POSITION_RECALCULATION_THRESHOLD,
} from './constants/card.constant';
import { BoardMember } from 'src/board/entities/board-member.entity';

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
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(BoardMember)
    private boardMemberRepository: Repository<BoardMember>,
  ) {}

  //카드 생성 API
  async createCard(createCardDto: CreateCardDto): Promise<Card> {
    const { title, listId } = createCardDto;
    const list = await this.listRepository.findOne({ where: { id: listId } });

    //리스트 찾기
    if (!list) {
      throw new NotFoundException('해당 리스트가 없습니다.');
    }

    //카드 생성 제한
    const cardCount = await this.cardRepository.count({ where: { list: { id: listId }, deletedAt: null } });
    if (cardCount >= MAX_CARD_COUNT) {
      throw new BadRequestException('카드 생성 제한을 초과했습니다.');
    }

    // 포지션 값 계산
    const lastCard = await this.cardRepository.findOne({
      where: { list: { id: listId }, deletedAt: null },
      order: { position: 'DESC' },
    });
    const position = lastCard ? lastCard.position * POSITION_MULTIPLIER : INITIAL_POSITION;

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
      order: { position: 'ASC' },
    });
    if (!card) {
      throw new NotFoundException('해당 카드를 찾을 수 없습니다.');
    }
    return card;
  }

  // 카드 수정 API
  async updateCardById(id: number, updateCardDto: UpdateCardDto): Promise<Card> {
    const card = await this.cardRepository.update(id, updateCardDto);
    // 카드 존재 확인
    if (!card) {
      throw new NotFoundException('해당 카드를 찾을 수 없습니다.');
    }

    await this.cardRepository.update(id, updateCardDto);
    return this.getCardById(id);
  }

  // 카드 담당자 추가 API
  async addAssignee(cardId: number, assigneeId: number): Promise<{ cardAssignee: CardAssignee; user: User }> {
    const card = await this.cardRepository.findOne({ where: { id: cardId }, relations: ['list'] });
    if (!card) {
      throw new NotFoundException('해당 카드를 찾을 수 없습니다.');
    }

    const user = await this.userRepository.findOne({ where: { id: assigneeId } });
    if (!user) {
      throw new NotFoundException('해당 사용자를 찾을 수 없습니다.');
    }

    const list = card.list;

    // 보드 멤버 검증
    const isMember = await this.boardMemberRepository.findOne({
      where: { boardId: list.boardId, memberId: assigneeId },
    });
    if (!isMember) {
      throw new BadRequestException('해당 사용자는 보드 멤버가 아닙니다.');
    }

    const existingAssignee = await this.cardAssigneeRepository.findOne({ where: { cardId, assigneeId } });
    if (existingAssignee) {
      throw new BadRequestException('이미 담당자로 추가된 사용자입니다.');
    }

    const cardAssignee = this.cardAssigneeRepository.create({ cardId, assigneeId });
    await this.cardAssigneeRepository.save(cardAssignee);

    return { cardAssignee, user };
  }

  // 카드 담당자 삭제 API
  async removeAssignee(cardId: number, assigneeId: number): Promise<void> {
    const card = await this.cardRepository.findOne({ where: { id: cardId } });
    if (!card) {
      throw new NotFoundException('해당 카드를 찾을 수 없습니다.');
    }

    const existingAssignee = await this.cardAssigneeRepository.findOne({ where: { cardId, assigneeId } });
    if (!existingAssignee) {
      throw new NotFoundException('삭제할 담당자가 없습니다.');
    }

    await this.cardAssigneeRepository.delete({ cardId, assigneeId });
  }

  //카드 이동 API
  async moveCardById(cardId: number, moveCardDto: MoveCardDto): Promise<Card> {
    const { listId: targetListId, targetIndex } = moveCardDto;

    const card = await this.cardRepository.findOne({ where: { id: cardId }, relations: ['list'] });
    if (!card) {
      throw new NotFoundException('해당 카드를 찾을 수 없습니다.');
    }

    const targetList = await this.listRepository.findOne({ where: { id: targetListId } });
    if (!targetList) {
      throw new NotFoundException('옮길 리스트를 찾을 수 없습니다.');
    }

    // 타겟 리스트가 다른 보드에 속해 있는지 확인
    if (card.list.boardId !== targetList.boardId) {
      throw new BadRequestException('다른 보드에 있는 리스트로 카드를 옮길 수 없습니다.');
    }

    //오름차순으로 가져와 포지션 계산
    let targetListCards = await this.cardRepository.find({
      where: { list: { id: targetListId }, deletedAt: null },
      order: { position: 'ASC' },
    });

    // 필터를 사용해서 cardId가 같은, 즉 현재 이동할 카드를 로직에서 제외하고 계산
    targetListCards = targetListCards.filter((card) => card.id !== cardId);

    // targetIndex 값을 1부터 시작하게 입력한 값의 -1되는 변수 선언
    const realIndex = targetIndex - 1;

    let newPosition: number;

    if (targetListCards.length === 0) {
      // 옮길 리스트에 다른 카드가 없다면 새 카드의 포지션 값을 INITIAL_POSITION으로 설정
      newPosition = INITIAL_POSITION;
    } else {
      if (realIndex < 0 || realIndex > targetListCards.length) {
        throw new BadRequestException('유효한 인덱스를 입력해주세요.');
      }

      if (realIndex === 0) {
        newPosition = targetListCards[0].position / POSITION_MULTIPLIER;
      } else if (realIndex === targetListCards.length) {
        newPosition = targetListCards[targetListCards.length - 1].position * POSITION_MULTIPLIER;
      } else {
        const prevCard = targetListCards[realIndex - 1];
        const nextCard = targetListCards[realIndex];
        newPosition = (prevCard.position + nextCard.position) / POSITION_MULTIPLIER;
      }
    }

    /**
     * 소수점이 0.2미만으로 떨어지면 position 새로고침
     * 인덱스에 따라 1024의 2의 제곱으로 생성
     */
    if (newPosition % 1 !== 0 && newPosition % 1 < POSITION_RECALCULATION_THRESHOLD) {
      // 포지션 값들을 내림차순으로 정렬
      targetListCards.sort((a, b) => b.position - a.position);
      for (let i = 0; i < targetListCards.length; i++) {
        targetListCards[i].position = INITIAL_POSITION * Math.pow(POSITION_MULTIPLIER, i);
      }
      await this.cardRepository.save(targetListCards);
      newPosition = INITIAL_POSITION * Math.pow(POSITION_MULTIPLIER, targetListCards.length);
    }

    // 카드의 listId와 position 값 업데이트
    card.list = targetList;
    card.position = newPosition;
    await this.cardRepository.save(card);

    return card;
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
        deletedAt: null,
      },
      order: {
        position: 'ASC',
      },
    });
    return cards;
  }
}
