import { Injectable } from '@nestjs/common';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Board } from './entities/board.entity';
import { Repository } from 'typeorm';

@Injectable()
export class BoardService {
  constructor(@InjectRepository(Board) private readonly boardRepository: Repository<Board>) {}

  async create(createBoardDto: CreateBoardDto) {
    const { title, backgroundColor, adminId } = createBoardDto;
    const board = await this.boardRepository.save({
      adminId,
      title,
      backgroundColor,
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
    return board;
  }

  async update(id: number, updateBoardDto: UpdateBoardDto) {
    const updatingBoard = await this.boardRepository.update(id, updateBoardDto);
    const updatedBoard = await this.boardRepository.findOne({
      where: {
        id,
      },
    });
    return updatedBoard;
  }

  async delete(id: number) {
    const deletingBoard = await this.boardRepository.delete(id)
    return;
  }
}
