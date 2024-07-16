import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CommentDto } from './dto/comment.dto';
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

  async create(userId: number, commentDto: CommentDto) {
    const { cardId } = commentDto;

    // 존재하는 카드인지 확인
    const card = await this.cardRepository.findOne({
      where: { id: cardId },
      select: ['id'],
    });

    if (!card) {
      throw new NotFoundException('존재하지 않는 카드입니다.');
    }

    // 댓글 생성
    return await this.commentRepository.save({ commenterId: userId, ...commentDto });
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

  async update(userId: number, commentId: number, commentDto: CommentDto) {
    // 존재하는 카드인지 확인
    const { cardId } = commentDto;
    const card = await this.cardRepository.findOne({
      relations: ['comments'],
      where: { id: cardId },
      select: ['id', 'comments'],
    });

    if (!card) {
      throw new NotFoundException('존재하지 않는 카드입니다.');
    }

    // 존재하는 댓글인지 확인
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      select: ['id', 'commenterId'],
    });

    if (!comment) {
      throw new NotFoundException('존재하지 않는 댓글입니다.');
    }

    // 해당 카드의 댓글인지 확인
    const indexOfComment = card.comments.findIndex((comment) => comment.id === commentId);
    if (indexOfComment < 0) {
      throw new BadRequestException('해당 카드의 댓글이 아닙니다.');
    }

    // 댓글 작성자 본인인지 확인
    if (comment.commenterId !== userId) {
      throw new ForbiddenException('접근 권한이 없습니다.');
    }

    // 댓글 수정
    await this.commentRepository.update({ id: commentId }, commentDto);

    // 수정된 댓글 반환
    return await this.commentRepository.findOneBy({ id: commentId });
  }

  async delete(userId: number, commentId: number, cardId: number) {
    // 존재하는 카드인지 확인
    const card = await this.cardRepository.findOne({
      where: { id: cardId },
      select: ['id'],
    });

    if (!card) {
      throw new NotFoundException('존재하지 않는 카드입니다.');
    }

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
      throw new ForbiddenException('접근 권한이 없습니다.');
    }

    // 댓글 삭제
    await this.commentRepository.softDelete({ id: commentId });

    // 삭제 시간 반환
    const deletedComment = await this.commentRepository.findOne({
      where: { id: commentId },
      withDeleted: true,
    });
    console.log(deletedComment);

    return { id: commentId, deletedAt: deletedComment.deletedAt };
  }
}
