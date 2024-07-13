import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Board } from './entities/board.entity';
import { Repository } from 'typeorm';
import { NotFoundError } from 'rxjs';

@Injectable()
export class BoardService {
  constructor(@InjectRepository(Board) private readonly boardRepository: Repository<Board>) {}

  async create(userId: number, createBoardDto: CreateBoardDto) {
    const { title, backgroundColor, description } = createBoardDto;
    // adminId를 userId로 등록
    const board = await this.boardRepository.save({
      adminId: userId,
      title,
      backgroundColor,
      description,
    });
    return board;
  }

  async findAll() {
    const boards = await this.boardRepository.find();
    return boards;
  }

  async findOne(id: number) {
    const board = await this.boardRepository.findOne({
      where: {
        id,
      },
    });
    if (!board) {
      throw new NotFoundError('보드가 존재하지 않습니다.');
    }
    return board;
  }

  async update(id: number, userId, updateBoardDto: UpdateBoardDto) {
    const board = await this.boardRepository.findOne({
      where: {
        id,
      },
    });
    if (!board) {
      throw new NotFoundError('보드가 존재하지 않습니다.');
    }
    // board의 admin만 수정 가능
    if (userId !== board.adminId) {
      throw new UnauthorizedException('수정 권한이 없습니다.');
    }
    const updatingBoard = await this.boardRepository.update(id, updateBoardDto);
    const updatedBoard = await this.boardRepository.findOne({
      where: {
        id,
      },
    });
    return updatedBoard;
  }

  async delete(id: number) {
    const deletingBoard = await this.boardRepository.delete(id);
    return;
  }
}
