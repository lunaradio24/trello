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
    const list = await this.listsRepository.findOne({ where: { id: listId, boardId }, withDeleted: true });
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

    const list = await this.listsRepository.findOne({ where: { id: listId, boardId } });
    if (!list) {
      throw new NotFoundException('해당 리스트를 찾을 수 없습니다.');
    }

    // 오름차순으로 보드의 모든 리스트를 가져옴
    const boardLists = await this.listsRepository.find({
      where: { boardId },
      order: { position: 'ASC' },
    });

    let newPosition: number;

    if (boardLists.length === 0) {
      // 보드에 다른 리스트가 없다면 새 리스트의 포지션 값을 1024로 설정
      newPosition = 1024;
    } else {
      // targetListId가 제공되지 않았을 경우 에러 처리
      if (!targetListId) {
        throw new BadRequestException('타겟 리스트 ID를 입력해주세요.');
      }

      const targetListIndex = boardLists.findIndex((l) => l.id === targetListId);

      if (targetListIndex < 0) {
        throw new BadRequestException('리스트가 이동할 곳을 명확히 입력해주세요.');
      }

      const targetList = boardLists[targetListIndex];

      // 리스트가 이동할 곳이 타겟 리스트의 위일 때
      if (position === 'before') {
        const prevList = boardLists[targetListIndex - 1];

        if (prevList) {
          newPosition = (prevList.position + targetList.position) / 2;
        } else {
          newPosition = targetList.position / 2;
        }
      } else if (position === 'after') {
        // 리스트가 이동할 곳이 타겟 리스트의 아래일 때
        const nextList = boardLists[targetListIndex + 1];

        if (nextList) {
          newPosition = (targetList.position + nextList.position) / 2;
        } else {
          newPosition = targetList.position * 2;
        }
      } else {
        throw new Error('포지션 값이 올바르지 않습니다.');
      }
    }

    /**
     * 소수점이 0.2미만으로 떨어지면 position 새로고침
     * 인덱스에 따라 1024의 2의 제곱으로 생성
     */
    if (newPosition % 1 !== 0 && newPosition % 1 < 0.2) {
      // 포지션 값들을 내림차순으로 정렬
      boardLists.sort((a, b) => b.position - a.position);
      const factor = 1024;
      for (let i = 0; i < boardLists.length; i++) {
        boardLists[i].position = factor * Math.pow(2, i);
      }
      await this.listsRepository.save(boardLists);
      newPosition = factor * Math.pow(2, boardLists.length);
    }

    // 리스트의 position 값 업데이트
    list.position = newPosition;
    return this.listsRepository.save(list);
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
