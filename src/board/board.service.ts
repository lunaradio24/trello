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

  findOne(id: number) {
    return `This action returns a #${id} board`;
  }

  update(id: number, updateBoardDto: UpdateBoardDto) {
    return `This action updates a #${id} board`;
  }

  remove(id: number) {
    return `This action removes a #${id} board`;
  }
}
