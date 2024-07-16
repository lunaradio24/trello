import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { List } from './entities/list.entity';
import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';
import { MoveListDto } from './dto/move-list.dto';
import { Board } from 'src/board/entities/board.entity';
import {
  MAX_NUM_LISTS_IN_BOARD,
  INITIAL_POSITION_FACTOR,
  POSITION_RECALCULATION_THRESHOLD,
  POSITION_MULTIPLIER,
} from './constants/list.constant';

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

    // 오름차순으로 다시 정렬
    board.lists.sort((a, b) => a.position - b.position);

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
      relations: ['board'],
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

    // 리스트가 지정된 보드에 속해 있는지 확인
    if (list.board.id !== boardId) {
      throw new BadRequestException('리스트가 지정된 보드에 속해 있지 않습니다.');
    }

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

    // 리스트가 지정된 보드에 속해 있는지 확인
    if (list.board.id !== boardId) {
      throw new BadRequestException('리스트가 지정된 보드에 속해 있지 않습니다.');
    }

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
    const { targetIndex } = moveListDto;

    const list = await this.listsRepository.findOne({ where: { id: listId }, relations: ['board'] });
    if (!list) {
      throw new NotFoundException('해당 리스트를 찾을 수 없습니다.');
    }

    const boardId = list.board.id;

    const boardLists = await this.listsRepository.find({
      where: { boardId },
      order: { position: 'ASC' },
    });

    const realIndex = targetIndex - 1;

    if (realIndex < 0 || realIndex >= boardLists.length) {
      throw new BadRequestException('유효한 인덱스를 입력해주세요.');
    }

    if (boardLists.findIndex((l) => l.id === listId) === realIndex) {
      throw new BadRequestException('같은 보드의 같은 위치로 이동할 수 없습니다.');
    }

    let newPosition: number;

    if (realIndex === 0) {
      newPosition = boardLists[0].position / POSITION_MULTIPLIER;
    } else if (realIndex === boardLists.length - 1) {
      newPosition = boardLists[boardLists.length - 1].position * POSITION_MULTIPLIER;
    } else {
      const prevList = boardLists[realIndex - 1];
      const nextList = boardLists[realIndex];
      newPosition = (prevList.position + nextList.position) / POSITION_MULTIPLIER;
    }

    if (newPosition % 1 !== 0 && newPosition % 1 < POSITION_RECALCULATION_THRESHOLD) {
      boardLists.sort((a, b) => b.position - a.position);
      for (let i = 0; i < boardLists.length; i++) {
        boardLists[i].position = INITIAL_POSITION_FACTOR * Math.pow(POSITION_MULTIPLIER, i);
      }
      await this.listsRepository.save(boardLists);
      newPosition = INITIAL_POSITION_FACTOR * Math.pow(POSITION_MULTIPLIER, boardLists.length);
    }

    list.position = newPosition;
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
