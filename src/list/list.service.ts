import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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

  async findOne(listId: number): Promise<List> {
    const list = await this.listsRepository.findOne({ where: { id: listId } });
    if (!list) {
      throw new NotFoundException(`해당 리스트의 ${listId}를 찾을 수 없습니다.`);
    }
    return list;
  }

  async update(listId: number, updateListDto: UpdateListDto): Promise<List> {
    await this.listsRepository.update(listId, updateListDto);
    return this.findOne(listId);
  }

  async remove(listId: number): Promise<{ id: number; deletedAt: Date }> {
    const list = await this.listsRepository.findOne({ where: { id: listId }, withDeleted: true });
    if (!list) {
      throw new NotFoundException(`해당 리스트의 ${listId}를 찾을 수 없습니다.`);
    }
    if (list.deletedAt) {
      throw new ConflictException(`해당 리스트는 이미 삭제되었습니다.`);
    }
    await this.listsRepository.softDelete(listId);
    const deletedList = await this.listsRepository.findOne({ where: { id: listId }, withDeleted: true });
    return { id: deletedList.id, deletedAt: deletedList.deletedAt };
  }
  //가중치 방식(임시)
  async move(listId: number, moveListDto: MoveListDto): Promise<List> {
    const { boardId, newPosition } = moveListDto;

    const list = await this.findOne(listId);
    if (list.boardId !== boardId) {
      throw new Error('보드가 존재하지 않습니다.');
    }

    let lists = await this.listsRepository.find({
      where: { boardId },
      order: { position: 'ASC' },
    });

    if (newPosition < 1) {
      throw new NotFoundException(`유효하지 않은 위치입니다.`);
    }

    lists = lists.filter((l) => l.id !== listId);

    let newWeight: number;
    if (newPosition === 1) {
      newWeight = lists[0].position / 2;
    } else if (newPosition > lists.length) {
      newWeight = lists[lists.length - 1].position + 65536;
    } else {
      const prevList = lists[newPosition - 2];
      const nextList = lists[newPosition - 1];
      newWeight = (prevList.position + nextList.position) / 2;
    }

    list.position = newWeight;

    const minWeight = 1;
    const maxWeight = Number.MAX_SAFE_INTEGER;
    if (newWeight < minWeight || newWeight > maxWeight) {
      await this.rebalanceWeights(boardId);
    }

    await this.listsRepository.save(list);
    return list;
  }

  async rebalanceWeights(boardId: number): Promise<void> {
    const lists = await this.listsRepository.find({
      where: { boardId },
      order: { position: 'ASC' },
    });

    const baseWeight = 65536;
    for (let i = 0; i < lists.length; i++) {
      lists[i].position = baseWeight * (i + 1);
    }

    await this.listsRepository.save(lists);
  }

  async findAll(boardId: number) {
    const lists = await this.listsRepository.findBy({ boardId });
    return lists;
  }

  // board 상세조회 시 lists 불러오기
  async findAllBoards(boardId: number) {
    const lists = await this.listsRepository.findBy({ boardId });
    return lists;
  }
}
