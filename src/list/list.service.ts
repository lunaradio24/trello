import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { List } from './entities/list.entity';
import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';
import { MoveListDto } from './dto/move-list.dto';
import { Board } from 'src/board/entities/board.entity';
import { INITIAL_POSITION_FACTOR, MAX_NUM_LISTS_IN_BOARD } from './constants/list.constant';

@Injectable()
export class ListService {
  constructor(
    @InjectRepository(List)
    private listsRepository: Repository<List>,
    @InjectRepository(Board)
    private boardRepository: Repository<Board>,
  ) {}

  async create(createListDto: CreateListDto): Promise<List> {
    const { boardId, title } = createListDto;

    // 존재하는 보드인지 확인
    const board = await this.boardRepository.findOne({
      where: { id: boardId, deletedAt: null },
      relations: ['lists'],
      select: ['id', 'lists'],
      order: {
        lists: {
          position: 'DESC',
        },
      },
    });

    if (!board) {
      throw new NotFoundException('존재하지 않는 보드입니다.');
    }

    // 보드에 속한 리스트 개수 확인
    const numLists = board.lists.length;

    if (numLists >= MAX_NUM_LISTS_IN_BOARD) {
      throw new ConflictException('리스트 생성 제한을 초과했습니다.');
    }

    // 새로 생성할 리스트의 position 설정
    const positionOfLastList = numLists > 0 ? board.lists[numLists - 1].position : null;
    const position = positionOfLastList ? positionOfLastList * 2 : INITIAL_POSITION_FACTOR;

    // DB에 리스트 생성 및 반환
    const newList = this.listsRepository.create({ boardId, title, position });
    return this.listsRepository.save(newList);
  }

  async findOneByListId(listId: number): Promise<List> {
    const list = await this.listsRepository.findOne({
      where: { id: listId, deletedAt: null },
    });

    if (!list) {
      throw new NotFoundException('존재하지 않는 리스트입니다.');
    }

    return list;
  }

  async update(boardId: number, listId: number, updateListDto: UpdateListDto): Promise<List> {
    // 존재하는 보드인지 확인
    const board = await this.boardRepository.findOne({
      where: { id: boardId, deletedAt: null },
      select: ['id'],
    });

    if (!board) {
      throw new NotFoundException('존재하지 않는 보드입니다.');
    }

    // 존재하는 리스트인지 확인
    const list = await this.findOneByListId(listId);

    // 리스트 수정
    await this.listsRepository.update(listId, updateListDto);

    // 수정된 리스트 반환
    return await this.findOneByListId(listId);
  }

  async remove(boardId: number, listId: number): Promise<{ id: number; deletedAt: Date }> {
    // 존재하는 보드인지 확인
    const board = await this.boardRepository.findOne({
      where: { id: boardId, deletedAt: null },
      select: ['id'],
    });

    if (!board) {
      throw new NotFoundException('존재하지 않는 보드입니다.');
    }

    // 존재하는 리스트인지 확인
    const list = await this.findOneByListId(listId);

    // 리스트 삭제
    await this.listsRepository.softRemove(list);

    // 삭제된 리스트 ID와 삭제 시간 반환
    const { id, deletedAt } = await this.listsRepository.findOne({
      where: { id: listId },
      withDeleted: true,
      select: ['id', 'deletedAt'],
    });

    return { id, deletedAt };
  }

  async move(listId: number, moveListDto: MoveListDto): Promise<List> {
    const { boardId, targetListId, position } = moveListDto;

    // 존재하는 리스트인지 확인
    const list = await this.findOneByListId(listId);

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
