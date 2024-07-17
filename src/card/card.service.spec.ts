import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CardService } from './card.service';
import { Card } from './entities/card.entity';
import { CardAssignee } from './entities/card-assignee.entity';
import { List } from '../list/entities/list.entity';
import { User } from '../user/entities/user.entity';
import { BoardMember } from '../board/entities/board-member.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { MoveCardDto } from './dto/move-card.dto';
import { MAX_CARD_COUNT } from './constants/card.constant';

describe('CardService', () => {
  let service: CardService;
  let cardRepository: Repository<Card>;
  let cardAssigneeRepository: Repository<CardAssignee>;
  let listRepository: Repository<List>;
  let userRepository: Repository<User>;
  let boardMemberRepository: Repository<BoardMember>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CardService,
        { provide: getRepositoryToken(Card), useClass: Repository },
        { provide: getRepositoryToken(CardAssignee), useClass: Repository },
        { provide: getRepositoryToken(List), useClass: Repository },
        { provide: getRepositoryToken(User), useClass: Repository },
        { provide: getRepositoryToken(BoardMember), useClass: Repository },
      ],
    }).compile();

    service = module.get<CardService>(CardService);
    cardRepository = module.get<Repository<Card>>(getRepositoryToken(Card));
    cardAssigneeRepository = module.get<Repository<CardAssignee>>(getRepositoryToken(CardAssignee));
    listRepository = module.get<Repository<List>>(getRepositoryToken(List));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    boardMemberRepository = module.get<Repository<BoardMember>>(getRepositoryToken(BoardMember));
  });

  describe('createCard', () => {
    it('새로운 카드를 생성해야 합니다', async () => {
      const createCardDto: CreateCardDto = { title: 'New Card', listId: 1 };
      const list = new List();
      list.id = createCardDto.listId;

      jest.spyOn(listRepository, 'findOne').mockResolvedValue(list);
      jest.spyOn(cardRepository, 'count').mockResolvedValue(0);
      jest.spyOn(cardRepository, 'findOne').mockResolvedValue(null);

      const card = new Card();
      card.title = createCardDto.title;
      card.list = list;
      card.position = 1;

      jest.spyOn(cardRepository, 'create').mockReturnValue(card);
      jest.spyOn(cardRepository, 'save').mockResolvedValue(card);

      const result = await service.createCard(createCardDto);
      expect(result).toEqual(card);
    });

    it('리스트를 찾지 못하면 NotFoundException을 던져야 합니다', async () => {
      const createCardDto: CreateCardDto = { title: 'New Card', listId: 1 };

      jest.spyOn(listRepository, 'findOne').mockResolvedValue(null);

      await expect(service.createCard(createCardDto)).rejects.toThrow(NotFoundException);
    });

    it('카드 개수가 최대 한도를 초과하면 BadRequestException을 던져야 합니다', async () => {
      const createCardDto: CreateCardDto = { title: 'New Card', listId: 1 };
      const list = new List();
      list.id = createCardDto.listId;

      jest.spyOn(listRepository, 'findOne').mockResolvedValue(list);
      jest.spyOn(cardRepository, 'count').mockResolvedValue(MAX_CARD_COUNT);

      await expect(service.createCard(createCardDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getCardById', () => {
    it('카드 상세 정보를 반환해야 합니다', async () => {
      const cardId = 1;
      const card = new Card();
      card.id = cardId;
      card.title = 'Test Card';
      card.description = 'This is a test card';
      card.position = 1;
      card.listId = 1;
      card.createdAt = new Date();
      card.updatedAt = new Date();
      card.color = '#ffffff';
      card.dueDate = null;
      card.comments = [];
      card.cardAssignees = [];
      card.checklists = [];
      card.attachments = [];

      jest.spyOn(cardRepository, 'findOne').mockResolvedValue(card);

      const result = await service.getCardById(cardId);
      expect(result).toEqual({
        id: card.id,
        title: card.title,
        description: card.description,
        position: card.position,
        listId: card.listId,
        createdAt: card.createdAt,
        updatedAt: card.updatedAt,
        color: card.color,
        dueDate: card.dueDate,
        comments: [],
        assignees: [],
        checklists: [],
        attachments: [],
      });
    });

    it('카드를 찾지 못하면 NotFoundException을 던져야 합니다', async () => {
      const cardId = 1;
      jest.spyOn(cardRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getCardById(cardId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateCardById', () => {
    it('카드를 수정하고 수정된 카드 정보를 반환해야 합니다', async () => {
      const cardId = 1;
      const updateCardDto: UpdateCardDto = { title: 'Updated Card' };
      const card = new Card();
      card.id = cardId;
      card.title = 'Original Card';
      card.listId = 1;

      jest.spyOn(cardRepository, 'findOne').mockResolvedValue(card);
      jest.spyOn(cardRepository, 'update').mockResolvedValue({ affected: 1 } as any);
      jest.spyOn(service, 'getCardById').mockResolvedValue({
        id: card.id,
        title: updateCardDto.title,
        description: card.description,
        position: card.position,
        listId: card.listId,
        createdAt: card.createdAt,
        updatedAt: card.updatedAt,
        color: card.color,
        dueDate: card.dueDate,
        comments: [],
        assignees: [],
        checklists: [],
        attachments: [],
      });

      const result = await service.updateCardById(cardId, updateCardDto);
      expect(result).toEqual({
        id: card.id,
        title: updateCardDto.title,
        description: card.description,
        position: card.position,
        listId: card.listId,
        createdAt: card.createdAt,
        updatedAt: card.updatedAt,
        color: card.color,
        dueDate: card.dueDate,
        comments: [],
        assignees: [],
        checklists: [],
        attachments: [],
      });
    });

    it('카드를 찾지 못하면 NotFoundException을 던져야 합니다', async () => {
      const cardId = 1;
      const updateCardDto: UpdateCardDto = { title: 'Updated Card' };

      jest.spyOn(cardRepository, 'update').mockResolvedValue({ affected: 0 } as any);
      jest.spyOn(cardRepository, 'findOne').mockResolvedValue(null);

      await expect(service.updateCardById(cardId, updateCardDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('addAssignee', () => {
    it('카드에 담당자를 추가해야 합니다', async () => {
      const cardId = 1;
      const assigneeId = 1;
      const card = new Card();
      card.id = cardId;
      const user = new User();
      user.id = assigneeId;
      const list = new List();
      list.boardId = 1;
      card.list = list;

      jest.spyOn(cardRepository, 'findOne').mockResolvedValue(card);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);
      jest.spyOn(boardMemberRepository, 'findOne').mockResolvedValue(new BoardMember());
      jest.spyOn(cardAssigneeRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(cardAssigneeRepository, 'create').mockReturnValue(new CardAssignee());
      jest.spyOn(cardAssigneeRepository, 'save').mockResolvedValue(new CardAssignee());

      const result = await service.addAssignee(cardId, assigneeId);
      expect(result).toEqual({ cardAssignee: new CardAssignee(), user });
    });

    it('카드를 찾지 못하면 NotFoundException을 던져야 합니다', async () => {
      const cardId = 1;
      const assigneeId = 1;

      jest.spyOn(cardRepository, 'findOne').mockResolvedValue(null);

      await expect(service.addAssignee(cardId, assigneeId)).rejects.toThrow(NotFoundException);
    });

    it('사용자를 찾지 못하면 NotFoundException을 던져야 합니다', async () => {
      const cardId = 1;
      const assigneeId = 1;
      const card = new Card();
      card.id = cardId;

      jest.spyOn(cardRepository, 'findOne').mockResolvedValue(card);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.addAssignee(cardId, assigneeId)).rejects.toThrow(NotFoundException);
    });

    it('사용자가 보드 멤버가 아니면 BadRequestException을 던져야 합니다', async () => {
      const cardId = 1;
      const assigneeId = 1;
      const card = new Card();
      card.id = cardId;
      const user = new User();
      user.id = assigneeId;
      const list = new List();
      list.boardId = 1;
      card.list = list;

      jest.spyOn(cardRepository, 'findOne').mockResolvedValue(card);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);
      jest.spyOn(boardMemberRepository, 'findOne').mockResolvedValue(null);

      await expect(service.addAssignee(cardId, assigneeId)).rejects.toThrow(BadRequestException);
    });

    it('담당자가 이미 존재하면 BadRequestException을 던져야 합니다', async () => {
      const cardId = 1;
      const assigneeId = 1;
      const card = new Card();
      card.id = cardId;
      const user = new User();
      user.id = assigneeId;
      const list = new List();
      list.boardId = 1;
      card.list = list;

      jest.spyOn(cardRepository, 'findOne').mockResolvedValue(card);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);
      jest.spyOn(boardMemberRepository, 'findOne').mockResolvedValue(new BoardMember());
      jest.spyOn(cardAssigneeRepository, 'findOne').mockResolvedValue(new CardAssignee());

      await expect(service.addAssignee(cardId, assigneeId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeAssignee', () => {
    it('카드에서 담당자를 삭제해야 합니다', async () => {
      const cardId = 1;
      const assigneeId = 1;
      const card = new Card();
      card.id = cardId;

      jest.spyOn(cardRepository, 'findOne').mockResolvedValue(card);
      jest.spyOn(cardAssigneeRepository, 'findOne').mockResolvedValue(new CardAssignee());
      jest.spyOn(cardAssigneeRepository, 'delete').mockResolvedValue(null);

      await service.removeAssignee(cardId, assigneeId);
      expect(cardAssigneeRepository.delete).toHaveBeenCalledWith({ cardId, assigneeId });
    });

    it('카드를 찾지 못하면 NotFoundException을 던져야 합니다', async () => {
      const cardId = 1;
      const assigneeId = 1;

      jest.spyOn(cardRepository, 'findOne').mockResolvedValue(null);

      await expect(service.removeAssignee(cardId, assigneeId)).rejects.toThrow(NotFoundException);
    });

    it('담당자를 찾지 못하면 NotFoundException을 던져야 합니다', async () => {
      const cardId = 1;
      const assigneeId = 1;
      const card = new Card();
      card.id = cardId;

      jest.spyOn(cardRepository, 'findOne').mockResolvedValue(card);
      jest.spyOn(cardAssigneeRepository, 'findOne').mockResolvedValue(null);

      await expect(service.removeAssignee(cardId, assigneeId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('moveCardById', () => {
    it('카드를 새로운 위치로 이동해야 합니다', async () => {
      const cardId = 1;
      const moveCardDto: MoveCardDto = { listId: 2, targetIndex: 1 };
      const card = new Card();
      card.id = cardId;
      const targetList = new List();
      targetList.id = moveCardDto.listId;
      targetList.boardId = 1;
      card.list = new List();
      card.list.boardId = 1;

      jest.spyOn(cardRepository, 'findOne').mockResolvedValue(card);
      jest.spyOn(listRepository, 'findOne').mockResolvedValue(targetList);
      jest.spyOn(cardRepository, 'find').mockResolvedValue([]);
      jest.spyOn(cardRepository, 'save').mockResolvedValue(card);

      const result = await service.moveCardById(cardId, moveCardDto);
      expect(result).toEqual(card);
    });

    it('카드를 찾지 못하면 NotFoundException을 던져야 합니다', async () => {
      const cardId = 1;
      const moveCardDto: MoveCardDto = { listId: 2, targetIndex: 1 };

      jest.spyOn(cardRepository, 'findOne').mockResolvedValue(null);

      await expect(service.moveCardById(cardId, moveCardDto)).rejects.toThrow(NotFoundException);
    });

    it('목표 리스트를 찾지 못하면 NotFoundException을 던져야 합니다', async () => {
      const cardId = 1;
      const moveCardDto: MoveCardDto = { listId: 2, targetIndex: 1 };
      const card = new Card();
      card.id = cardId;

      jest.spyOn(cardRepository, 'findOne').mockResolvedValue(card);
      jest.spyOn(listRepository, 'findOne').mockResolvedValue(null);

      await expect(service.moveCardById(cardId, moveCardDto)).rejects.toThrow(NotFoundException);
    });

    it('목표 리스트가 다른 보드에 속해 있으면 BadRequestException을 던져야 합니다', async () => {
      const cardId = 1;
      const moveCardDto: MoveCardDto = { listId: 2, targetIndex: 1 };
      const card = new Card();
      card.id = cardId;
      card.list = new List();
      card.list.boardId = 1;
      const targetList = new List();
      targetList.id = moveCardDto.listId;
      targetList.boardId = 2;

      jest.spyOn(cardRepository, 'findOne').mockResolvedValue(card);
      jest.spyOn(listRepository, 'findOne').mockResolvedValue(targetList);

      await expect(service.moveCardById(cardId, moveCardDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeCardById', () => {
    it('카드를 소프트 딜리트해야 합니다', async () => {
      const cardId = 1;
      const card = new Card();
      card.id = cardId;
      const deletedCard = { ...card, deletedAt: new Date() };

      jest.spyOn(cardRepository, 'findOneBy').mockResolvedValue(card);
      jest.spyOn(cardRepository, 'softDelete').mockResolvedValue(null);
      jest.spyOn(cardRepository, 'findOne').mockResolvedValue(deletedCard);

      const result = await service.removeCardById(cardId);
      expect(cardRepository.softDelete).toHaveBeenCalledWith({ id: cardId });
      expect(result).toEqual({ id: cardId, deletedAt: deletedCard.deletedAt });
    });

    it('카드를 찾지 못하면 NotFoundException을 던져야 합니다', async () => {
      const cardId = 1;

      jest.spyOn(cardRepository, 'findOneBy').mockResolvedValue(null);

      await expect(service.removeCardById(cardId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllBoards', () => {
    it('보드의 모든 카드를 반환해야 합니다', async () => {
      const listId = 1;
      const cards = [new Card(), new Card()];

      jest.spyOn(cardRepository, 'find').mockResolvedValue(cards);

      const result = await service.findAllBoards(listId);
      expect(result).toEqual(cards);
    });
  });
});
