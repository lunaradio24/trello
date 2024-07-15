import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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

    const listCount = await this.listsRepository.count({ where: { boardId } });
    if (listCount >= 12) {
      throw new ConflictException('리스트 생성 제한을 초과했습니다.');
    }

    const lastList = await this.listsRepository.findOne({
      where: { boardId },
      order: { position: 'DESC' },
    });

    const position = lastList ? lastList.position * 2 : 1024;

    const newList = this.listsRepository.create({
      boardId,
      title,
      position,
    });

    return this.listsRepository.save(newList);
  }

  async findOne(boardId: number, listId: number): Promise<List> {
    const list = await this.listsRepository.findOne({ where: { id: listId, boardId } });
    if (!list) {
      throw new NotFoundException(`해당 보드의 ${listId} 리스트를 찾을 수 없습니다.`);
    }
    return list;
  }

  async update(boardId: number, listId: number, updateListDto: UpdateListDto): Promise<List> {
    const list = await this.findOne(boardId, listId);
    await this.listsRepository.update(listId, updateListDto);
    return this.findOne(boardId, listId);
  }

  async remove(boardId: number, listId: number): Promise<{ id: number; deletedAt: Date }> {
    const list = await this.findOne(boardId, listId);
    if (list.deletedAt) {
      throw new ConflictException(`해당 리스트는 이미 삭제되었습니다.`);
    }
    await this.listsRepository.softDelete(listId);
    const deletedList = await this.listsRepository.findOne({ where: { id: listId }, withDeleted: true });
    return { id: deletedList.id, deletedAt: deletedList.deletedAt };
  }

  async move(listId: number, moveListDto: MoveListDto): Promise<List> {
    const { boardId, targetListId, position } = moveListDto;

    const list = await this.findOne(boardId, listId);
    if (!list) {
      throw new NotFoundException('해당 리스트를 찾을 수 없습니다.');
    }

    const targetBoard = await this.listsRepository.findOne({ where: { id: boardId } });
    if (!targetBoard) {
      throw new NotFoundException('옮길 리스트를 찾을 수 없습니다.');
    }

    const targetLists = await this.listsRepository.find({
      where: { boardId },
      order: { position: 'ASC' },
    });

    if (targetLists.length === 0) {
      throw new NotFoundException('옮길 리스트가 없습니다.');
    }

    const targetListIndex = targetLists.findIndex((l) => l.id === targetListId);
    if (targetListIndex < 0) {
      throw new BadRequestException('리스트가 이동할 곳을 명확히 입력해주세요.');
    }

    let newPosition: number;
    if (targetLists.length === 1) {
      // 옮길 리스트에 다른 리스트가 없다면 새 리스트의 포지션 값을 1024로 설정
      newPosition = 1024;
    } else {
      const targetList = targetLists[targetListIndex];
      if (position === 'before') {
        const prevList = targetLists[targetListIndex - 1];

        if (prevList) {
          newPosition = (prevList.position + targetList.position) / 2;
        } else {
          newPosition = targetList.position / 2;
        }
      } else if (position === 'after') {
        const nextList = targetLists[targetListIndex + 1];

        if (nextList) {
          newPosition = (targetList.position + nextList.position) / 2;
        } else {
          newPosition = targetList.position * 2;
        }
      } else {
        throw new Error('Invalid position specified');
      }
    }

    list.position = newPosition;

    // Check if rebalancing is needed
    const minPositionDifference = 1;
    for (let i = 1; i < targetLists.length; i++) {
      if (targetLists[i].position - targetLists[i - 1].position < minPositionDifference) {
        const factor = 1024;
        for (let j = 0; j < targetLists.length; j++) {
          targetLists[j].position = factor * (j + 1);
        }
        await this.listsRepository.save(targetLists);
        newPosition = factor * Math.pow(2, targetLists.length);
        list.position = newPosition;
        await this.listsRepository.save(list);
        break;
      }
    }

    await this.listsRepository.save(list);
    return list;
  }

  async findAll(boardId: number) {
    const lists = await this.listsRepository.find({
      where: { boardId },
      order: { position: 'ASC' },
    });
    return lists;
  }

  // board 상세조회 시 lists 불러오기
  async findAllBoards(boardId: number) {
    const lists = await this.listsRepository.findBy({ boardId });
    return lists;
  }
}
