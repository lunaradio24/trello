import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CommentDto } from './dto/comment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) {}

  async create(userId: number, commentDto: CommentDto) {
    const { cardId } = commentDto;

    // 존재하는 카드인지 확인
    const card = await this.commentRepository.findOneBy({ cardId });
    if (!card) {
      throw new NotFoundException('존재하지 않는 카드입니다.');
    }

    return await this.commentRepository.save({ commenterId: userId, ...commentDto });
  }

  async getListByCardId(cardId: number) {
    // 존재하는 카드인지 확인
    const card = await this.commentRepository.findOneBy({ cardId });
    if (!card) {
      throw new NotFoundException('존재하지 않는 카드입니다.');
    }

    return await this.commentRepository.findBy({ cardId });
  }

  async getListByCommenterId(commenterId: number) {
    return await this.commentRepository.findBy({ commenterId });
  }

  async update(userId: number, commentId: number, commentDto: CommentDto) {
    // 존재하는 카드인지 확인
    const { cardId } = commentDto;
    const card = await this.commentRepository.findOneBy({ cardId });
    if (!card) {
      throw new NotFoundException('존재하지 않는 카드입니다.');
    }

    // 댓글 작성자 본인인지 확인
    if (card.commenterId !== userId) {
      throw new ForbiddenException('접근 권한이 없습니다.');
    }

    return await this.commentRepository.update({ id: commentId }, commentDto);
  }

  async remove(userId: number, commentId: number, cardId: number) {
    // 존재하는 카드인지 확인
    const card = await this.commentRepository.findOneBy({ cardId });
    if (!card) {
      throw new NotFoundException('존재하지 않는 카드입니다.');
    }

    // 댓글 작성자 본인인지 확인
    if (card.commenterId !== userId) {
      throw new ForbiddenException('접근 권한이 없습니다.');
    }

    return await this.commentRepository.softDelete({ id: commentId });
  }
}
