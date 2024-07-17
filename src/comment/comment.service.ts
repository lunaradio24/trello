import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { Repository } from 'typeorm';
import { Card } from '../card/entities/card.entity';
import { User } from '../user/entities/user.entity';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(userId: number, createCommentDto: CreateCommentDto) {
    const { cardId } = createCommentDto;

    // 존재하는 카드인지 확인
    const card = await this.cardRepository.findOne({
      where: { id: cardId },
      select: ['id'],
    });

    if (!card) {
      throw new NotFoundException('존재하지 않는 카드입니다.');
    }

    // 댓글 생성
    return await this.commentRepository.save({ commenterId: userId, ...createCommentDto });
  }

  async getListByCardId(cardId: number) {
    // 존재하는 카드인지 확인
    const card = await this.cardRepository.findOne({
      where: { id: cardId },
      select: ['id'],
    });

    if (!card) {
      throw new NotFoundException('존재하지 않는 카드입니다.');
    }

    // 카드의 댓글 목록 조회
    return await this.commentRepository.find({ where: { cardId } });
  }

  async getListByCommenterId(commenterId: number) {
    // 존재하는 유저인지 확인
    const user = await this.userRepository.findOne({
      where: { id: commenterId },
      select: ['id'],
    });

    if (!user) {
      throw new NotFoundException('존재하지 않는 유저입니다.');
    }

    // 내 댓글 목록 조회
    return await this.commentRepository.find({ where: { commenterId } });
  }

  async update(userId: number, commentId: number, updateCommentDto: UpdateCommentDto) {
    // 존재하는 댓글인지 확인
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      select: ['id', 'commenterId'],
    });

    if (!comment) {
      throw new NotFoundException('존재하지 않는 댓글입니다.');
    }

    // 댓글 작성자 본인인지 확인
    if (comment.commenterId !== userId) {
      throw new ForbiddenException('수정 권한이 없습니다.');
    }

    // 댓글 수정
    await this.commentRepository.update({ id: commentId }, updateCommentDto);

    // 수정된 댓글 반환
    return await this.commentRepository.findOneBy({ id: commentId });
  }

  async delete(userId: number, commentId: number) {
    // 존재하는 댓글인지 확인
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      select: ['id', 'commenterId'],
    });

    if (!comment) {
      throw new NotFoundException('존재하지 않는 댓글입니다.');
    }

    // 댓글 작성자 본인인지 확인
    if (comment.commenterId !== userId) {
      throw new ForbiddenException('삭제 권한이 없습니다.');
    }

    // 댓글 삭제
    await this.commentRepository.delete({ id: commentId });

    return { id: commentId };
  }
}
