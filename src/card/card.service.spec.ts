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
        {
          provide: getRepositoryToken(Card),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(CardAssignee),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(List),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(BoardMember),
          useClass: Repository,
        },
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
    it('should create a new card', async () => {
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

    it('should throw a NotFoundException if list not found', async () => {
      const createCardDto: CreateCardDto = { title: 'New Card', listId: 1 };

      jest.spyOn(listRepository, 'findOne').mockResolvedValue(null);

      await expect(service.createCard(createCardDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw a BadRequestException if card count exceeds limit', async () => {
      const createCardDto: CreateCardDto = { title: 'New Card', listId: 1 };
      const list = new List();
      list.id = createCardDto.listId;

      jest.spyOn(listRepository, 'findOne').mockResolvedValue(list);
      jest.spyOn(cardRepository, 'count').mockResolvedValue(MAX_CARD_COUNT);

      await expect(service.createCard(createCardDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getCardById', () => {
    it('should return card details', async () => {
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

    it('should throw a NotFoundException if card not found', async () => {
      const cardId = 1;
      jest.spyOn(cardRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getCardById(cardId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateCardById', () => {
    it('should update card and return updated card details', async () => {
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

    it('should throw a NotFoundException if card not found', async () => {
      const cardId = 1;
      const updateCardDto: UpdateCardDto = { title: 'Updated Card' };

      jest.spyOn(cardRepository, 'update').mockResolvedValue({ affected: 0 } as any);

      await expect(service.updateCardById(cardId, updateCardDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('addAssignee', () => {
    it('should add an assignee to the card', async () => {
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

    it('should throw a NotFoundException if card not found', async () => {
      const cardId = 1;
      const assigneeId = 1;

      jest.spyOn(cardRepository, 'findOne').mockResolvedValue(null);

      await expect(service.addAssignee(cardId, assigneeId)).rejects.toThrow(NotFoundException);
    });

    it('should throw a NotFoundException if user not found', async () => {
      const cardId = 1;
      const assigneeId = 1;
      const card = new Card();
      card.id = cardId;

      jest.spyOn(cardRepository, 'findOne').mockResolvedValue(card);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.addAssignee(cardId, assigneeId)).rejects.toThrow(NotFoundException);
    });

    it('should throw a BadRequestException if user is not a board member', async () => {
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

    it('should throw a BadRequestException if assignee already exists', async () => {
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
    it('should remove an assignee from the card', async () => {
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

    it('should throw a NotFoundException if card not found', async () => {
      const cardId = 1;
      const assigneeId = 1;

      jest.spyOn(cardRepository, 'findOne').mockResolvedValue(null);

      await expect(service.removeAssignee(cardId, assigneeId)).rejects.toThrow(NotFoundException);
    });

    it('should throw a NotFoundException if assignee not found', async () => {
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
    it('should move the card to a new position', async () => {
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

    it('should throw a NotFoundException if card not found', async () => {
      const cardId = 1;
      const moveCardDto: MoveCardDto = { listId: 2, targetIndex: 1 };

      jest.spyOn(cardRepository, 'findOne').mockResolvedValue(null);

      await expect(service.moveCardById(cardId, moveCardDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw a NotFoundException if target list not found', async () => {
      const cardId = 1;
      const moveCardDto: MoveCardDto = { listId: 2, targetIndex: 1 };
      const card = new Card();
      card.id = cardId;

      jest.spyOn(cardRepository, 'findOne').mockResolvedValue(card);
      jest.spyOn(listRepository, 'findOne').mockResolvedValue(null);

      await expect(service.moveCardById(cardId, moveCardDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw a BadRequestException if target list is in a different board', async () => {
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
    it('should soft delete the card', async () => {
      const cardId = 1;
      const card = new Card();
      card.id = cardId;

      jest.spyOn(cardRepository, 'findOneBy').mockResolvedValue(card);
      jest.spyOn(cardRepository, 'softDelete').mockResolvedValue(null);

      await service.removeCardById(cardId);
      expect(cardRepository.softDelete).toHaveBeenCalledWith({ id: cardId });
    });

    it('should throw a NotFoundException if card not found', async () => {
      const cardId = 1;

      jest.spyOn(cardRepository, 'findOneBy').mockResolvedValue(null);

      await expect(service.removeCardById(cardId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllBoards', () => {
    it('should return all cards in a board', async () => {
      const listId = 1;
      const cards = [new Card(), new Card()];

      jest.spyOn(cardRepository, 'find').mockResolvedValue(cards);

      const result = await service.findAllBoards(listId);
      expect(result).toEqual(cards);
    });
  });
});
