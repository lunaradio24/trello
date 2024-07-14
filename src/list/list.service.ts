import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { List } from './entities/list.entity';
import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';
import { MoveListDto } from './dto/move-list.dto';

@Injectable()
export class ListService {
  constructor(
    @InjectRepository(List)
    private listsRepository: Repository<List>,
  ) {}

  async create(createListDto: CreateListDto): Promise<List> {
    const { boardId, title } = createListDto;

    const lastList = await this.listsRepository.findOne({
      where: { boardId },
      order: { position: 'DESC' },
    });

    const position = lastList ? lastList.position + 1 : 1;

    const newList = this.listsRepository.create({
      boardId,
      title,
      position,
    });

    return await this.listsRepository.save(newList);
  }

  async findOne(id: number): Promise<List> {
    const list = await this.listsRepository.findOne({ where: { id } });
    if (!list) {
      throw new NotFoundException(`List with ID ${id} not found`);
    }
    return list;
  }

  async update(id: number, updateListDto: UpdateListDto): Promise<List> {
    await this.listsRepository.update(id, updateListDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.listsRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`List with ID ${id} not found`);
    }
  }

  async move(id: number, moveListDto: MoveListDto): Promise<List> {
    const { boardId, newPosition } = moveListDto;

    const list = await this.findOne(id);
    if (list.boardId !== boardId) {
      throw new Error('List does not belong to the specified board');
    }

    const lists = await this.listsRepository.find({
      where: { boardId },
      order: { position: 'ASC' },
    });

    // 새로운 위치의 이전과 이후 포지션 값을 계산
    const prevPosition = newPosition > 1 ? lists[newPosition - 2].position : 0;
    const nextPosition =
      newPosition <= lists.length ? lists[newPosition - 1].position : lists[lists.length - 1].position + 16384;

    // 새 포지션 값 계산
    list.position = (prevPosition + nextPosition) / 2;

    await this.listsRepository.save(list);
    return list;
  }

  // board 상세조회 시 lists 불러오기
  async findAll(boardId: number) {
    const lists = await this.listsRepository.findBy({ boardId });
    return lists;
  }
}
