import { Test, TestingModule } from '@nestjs/testing';
import { CommentService } from './comment.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { Card } from '../card/entities/card.entity';
import { User } from '../user/entities/user.entity';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';

describe('CommentService', () => {
  let service: CommentService;
  let commentRepository: Repository<Comment>;
  let cardRepository: Repository<Card>;
  let userRepository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentService,
        {
          provide: getRepositoryToken(Comment),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Card),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<CommentService>(CommentService);
    commentRepository = module.get<Repository<Comment>>(getRepositoryToken(Comment));
    cardRepository = module.get<Repository<Card>>(getRepositoryToken(Card));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('서비스가 정의되어 있어야 함', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('카드가 존재하지 않으면 NotFoundException을 던져야 함', async () => {
      jest.spyOn(cardRepository, 'findOne').mockResolvedValue(null);

      await expect(service.create(1, { cardId: 1, content: '테스트 댓글' })).rejects.toThrow(NotFoundException);
    });

    it('댓글을 생성해야 함', async () => {
      const card = new Card();
      card.id = 1;

      jest.spyOn(cardRepository, 'findOne').mockResolvedValue(card);
      jest
        .spyOn(commentRepository, 'save')
        .mockResolvedValue({ id: 1, cardId: 1, commenterId: 1, content: '테스트 댓글' } as Comment);

      const result = await service.create(1, { cardId: 1, content: '테스트 댓글' });
      expect(result).toEqual({ id: 1, cardId: 1, commenterId: 1, content: '테스트 댓글' });
    });
  });

  describe('getListByCardId', () => {
    it('카드가 존재하지 않으면 NotFoundException을 던져야 함', async () => {
      jest.spyOn(cardRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getListByCardId(1)).rejects.toThrow(NotFoundException);
    });

    it('댓글 목록을 반환해야 함', async () => {
      const card = new Card();
      card.id = 1;

      const comments = [
        { id: 1, cardId: 1, commenterId: 1, content: '댓글 1' },
        { id: 2, cardId: 1, commenterId: 2, content: '댓글 2' },
      ] as Comment[];

      jest.spyOn(cardRepository, 'findOne').mockResolvedValue(card);
      jest.spyOn(commentRepository, 'find').mockResolvedValue(comments);

      const result = await service.getListByCardId(1);
      expect(result).toEqual(comments);
    });
  });

  describe('getListByCommenterId', () => {
    it('유저가 존재하지 않으면 NotFoundException을 던져야 함', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getListByCommenterId(1)).rejects.toThrow(NotFoundException);
    });

    it('유저의 댓글 목록을 반환해야 함', async () => {
      const user = new User();
      user.id = 1;

      const comments = [
        { id: 1, cardId: 1, commenterId: 1, content: '댓글 1' },
        { id: 2, cardId: 2, commenterId: 1, content: '댓글 2' },
      ] as Comment[];

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);
      jest.spyOn(commentRepository, 'find').mockResolvedValue(comments);

      const result = await service.getListByCommenterId(1);
      expect(result).toEqual(comments);
    });
  });

  describe('update', () => {
    it('카드가 존재하지 않으면 NotFoundException을 던져야 함', async () => {
      jest.spyOn(cardRepository, 'findOne').mockResolvedValue(null);

      await expect(service.update(1, 1, { cardId: 1, content: '수정된 댓글' })).rejects.toThrow(NotFoundException);
    });

    it('댓글이 존재하지 않으면 NotFoundException을 던져야 함', async () => {
      const card = new Card();
      card.id = 1;
      card.comments = [];

      jest.spyOn(cardRepository, 'findOne').mockResolvedValue(card);
      jest.spyOn(commentRepository, 'findOne').mockResolvedValue(null);

      await expect(service.update(1, 1, { cardId: 1, content: '수정된 댓글' })).rejects.toThrow(NotFoundException);
    });

    it('댓글이 카드와 연관되지 않으면 BadRequestException을 던져야 함', async () => {
      const card = new Card();
      card.id = 1;
      card.comments = [{ id: 2 }] as Comment[];

      const comment = new Comment();
      comment.id = 1;

      jest.spyOn(cardRepository, 'findOne').mockResolvedValue(card);
      jest.spyOn(commentRepository, 'findOne').mockResolvedValue(comment);

      await expect(service.update(1, 1, { cardId: 1, content: '수정된 댓글' })).rejects.toThrow(BadRequestException);
    });

    it('유저가 댓글 작성자가 아니면 ForbiddenException을 던져야 함', async () => {
      const card = new Card();
      card.id = 1;
      card.comments = [{ id: 1 }] as Comment[];

      const comment = new Comment();
      comment.id = 1;
      comment.commenterId = 2;

      jest.spyOn(cardRepository, 'findOne').mockResolvedValue(card);
      jest.spyOn(commentRepository, 'findOne').mockResolvedValue(comment);

      await expect(service.update(1, 1, { cardId: 1, content: '수정된 댓글' })).rejects.toThrow(ForbiddenException);
    });

    it('댓글을 수정해야 함', async () => {
      const card = new Card();
      card.id = 1;
      card.comments = [{ id: 1 }] as Comment[];

      const comment = new Comment();
      comment.id = 1;
      comment.commenterId = 1;

      jest.spyOn(cardRepository, 'findOne').mockResolvedValue(card);
      jest.spyOn(commentRepository, 'findOne').mockResolvedValue(comment);
      jest.spyOn(commentRepository, 'update').mockResolvedValue(null);
      jest.spyOn(commentRepository, 'findOneBy').mockResolvedValue({ ...comment, content: '수정된 댓글' });

      const result = await service.update(1, 1, { cardId: 1, content: '수정된 댓글' });
      expect(result).toEqual({ ...comment, content: '수정된 댓글' });
    });
  });

  describe('delete', () => {
    it('카드가 존재하지 않으면 NotFoundException을 던져야 함', async () => {
      jest.spyOn(cardRepository, 'findOne').mockResolvedValue(null);

      await expect(service.delete(1, 1, 1)).rejects.toThrow(NotFoundException);
    });

    it('댓글이 존재하지 않으면 NotFoundException을 던져야 함', async () => {
      const card = new Card();
      card.id = 1;

      jest.spyOn(cardRepository, 'findOne').mockResolvedValue(card);
      jest.spyOn(commentRepository, 'findOne').mockResolvedValue(null);

      await expect(service.delete(1, 1, 1)).rejects.toThrow(NotFoundException);
    });

    it('유저가 댓글 작성자가 아니면 ForbiddenException을 던져야 함', async () => {
      const card = new Card();
      card.id = 1;

      const comment = new Comment();
      comment.id = 1;
      comment.commenterId = 2;

      jest.spyOn(cardRepository, 'findOne').mockResolvedValue(card);
      jest.spyOn(commentRepository, 'findOne').mockResolvedValue(comment);

      await expect(service.delete(1, 1, 1)).rejects.toThrow(ForbiddenException);
    });

    it('댓글을 삭제해야 함', async () => {
      const card = new Card();
      card.id = 1;

      const comment = new Comment();
      comment.id = 1;
      comment.commenterId = 1;

      jest.spyOn(cardRepository, 'findOne').mockResolvedValue(card);
      jest.spyOn(commentRepository, 'findOne').mockResolvedValue(comment);
      jest.spyOn(commentRepository, 'softDelete').mockResolvedValue(null);
      jest.spyOn(commentRepository, 'findOne').mockResolvedValue({ ...comment, deletedAt: new Date() });

      const result = await service.delete(1, 1, 1);
      expect(result).toEqual({ deletedAt: expect.any(Date) });
    });
  });
});
