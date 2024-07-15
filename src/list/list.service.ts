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

  async findOne(id: number): Promise<List> {
    const list = await this.listsRepository.findOne({ where: { id } });
    if (!list) {
      throw new NotFoundException(`해당 리스트의 ${id}를 찾을 수 없습니다.`);
    }
    return list;
  }

  async update(id: number, updateListDto: UpdateListDto): Promise<List> {
    await this.listsRepository.update(id, updateListDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const list = await this.listsRepository.findOne({ where: { id }, withDeleted: true });
    if (!list) {
      throw new NotFoundException(`해당 리스트의 ${id}를 찾을 수 없습니다.`);
    }
    if (list.deletedAt) {
      throw new ConflictException(`해당 리스트는 이미 삭제되었습니다.`);
    }
    await this.listsRepository.softDelete(id);
  }
  //방식 1 리스트 정렬방식
  // async move(id: number, moveListDto: MoveListDto): Promise<List> {
  //   const { boardId, newPosition } = moveListDto;

  //   const list = await this.findOne(id);
  //   if (list.boardId !== boardId) {
  //     throw new Error('보드가 존재하지않습니다.');
  //   }

  //   let lists = await this.listsRepository.find({
  //     where: { boardId },
  //     order: { position: 'ASC' },
  //   });

  //   // 기존 리스트에서 이동할 리스트를 제거
  //   lists = lists.filter((l) => l.id !== id);

  //   // 새 위치에 리스트 삽입
  //   lists.splice(newPosition - 1, 0, list);

  //   // 포지션 값 재설정
  //   for (let i = 0; i < lists.length; i++) {
  //     lists[i].position = i + 1;
  //   }

  //   await this.listsRepository.save(lists);
  //   return list;
  // }

  //방식2 가중치 기반 방식
  async move(id: number, moveListDto: MoveListDto): Promise<List> {
    const { boardId, newPosition } = moveListDto;

    const list = await this.findOne(id);
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

    // 기존 리스트에서 이동할 리스트를 제거
    lists = lists.filter((l) => l.id !== id);

    // 새로운 위치의 가중치 계산
    let newWeight: number;
    if (newPosition === 1) {
      newWeight = lists[0].position / 2;
    } else if (newPosition > lists.length) {
      // 새로운 위치가 리스트 길이를 초과할 경우 마지막 위치로 설정
      newWeight = lists[lists.length - 1].position + 65536; // 임의의 큰 값
    } else {
      const prevList = lists[newPosition - 2];
      const nextList = lists[newPosition - 1];
      newWeight = (prevList.position + nextList.position) / 2;
    }

    // 이동할 리스트의 가중치를 업데이트
    list.position = newWeight;

    // 가중치 값의 범위 체크 및 재조정
    const minWeight = 1;
    const maxWeight = Number.MAX_SAFE_INTEGER;
    if (newWeight < minWeight || newWeight > maxWeight) {
      await this.rebalanceWeights(boardId);
    }

    await this.listsRepository.save(list);
    return list;
  }

  // 가중치 값 재조정 메서드
  async rebalanceWeights(boardId: number): Promise<void> {
    const lists = await this.listsRepository.find({
      where: { boardId },
      order: { position: 'ASC' },
    });

    // 가중치 값을 순차적으로 재설정
    const baseWeight = 65536; // 초기 가중치 값
    for (let i = 0; i < lists.length; i++) {
      lists[i].position = baseWeight * (i + 1);
    }

    await this.listsRepository.save(lists);
  }

  async findAll(): Promise<List[]> {
    return this.listsRepository.find({
      order: { position: 'ASC' },
    });
  }
}
