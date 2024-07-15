import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Checklist } from './entities/checklist.entity';
import { Repository } from 'typeorm';
import { Card } from 'src/card/entities/card.entity';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { UpdateChecklistDto } from './dto/update-checklist.dto';

@Injectable()
export class ChecklistService {
  constructor(
    @InjectRepository(Checklist)
    private readonly checklistRepository: Repository<Checklist>,
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
  ) {}

  async create(createChecklistDto: CreateChecklistDto) {
    // 존재하는 카드인지 확인
    const { cardId } = createChecklistDto;
    const card = await this.cardRepository.findOne({ where: { id: cardId, deletedAt: null } });
    if (!card) {
      throw new NotFoundException('존재하지 않는 카드입니다.');
    }

    return await this.checklistRepository.insert(createChecklistDto);
  }

  async getOneByChecklistId(checklistId: number) {
    return await this.checklistRepository.findOneBy({ id: checklistId });
  }

  async getListByCardId(cardId: number) {
    return await this.checklistRepository.findBy({ cardId });
  }

  async check(checklistId: number) {
    // 존재하는 체크리스트인지 확인
    const checklist = await this.checklistRepository.findOne({
      where: { id: checklistId, deletedAt: null },
      select: ['id', 'isChecked'],
    });

    if (!checklist) {
      throw new NotFoundException('존재하지 않는 체크리스트입니다.');
    }

    // 체크 상태 확인
    if (checklist.isChecked === true) {
      throw new BadRequestException('이미 체크된 상태입니다.');
    }

    // 체크 상태로 변경
    await this.checklistRepository.update({ id: checklistId }, { isChecked: true });
    const { updatedAt } = await this.checklistRepository.findOne({
      where: { id: checklistId },
      select: ['id', 'updatedAt'],
    });

    return { checkedAt: updatedAt };
  }

  async uncheck(checklistId: number) {
    // 존재하는 체크리스트인지 확인
    const checklist = await this.checklistRepository.findOne({
      where: { id: checklistId, deletedAt: null },
      select: ['id', 'isChecked'],
    });

    if (!checklist) {
      throw new NotFoundException('존재하지 않는 체크리스트입니다.');
    }

    // 체크 상태 확인
    if (checklist.isChecked === false) {
      throw new BadRequestException('이미 언체크된 상태입니다.');
    }

    // 언체크 상태로 변경
    await this.checklistRepository.update({ id: checklistId }, { isChecked: false });
    const { updatedAt } = await this.checklistRepository.findOne({
      where: { id: checklistId },
      select: ['id', 'updatedAt'],
    });

    return { uncheckedAt: updatedAt };
  }

  async update(checklistId: number, updateChecklistDto: UpdateChecklistDto) {
    // 존재하는 체크리스트인지 확인
    const checklist = await this.checklistRepository.findOne({
      where: { id: checklistId, deletedAt: null },
      select: ['id', 'content', 'dueDate'],
    });

    if (!checklist) {
      throw new NotFoundException('존재하지 않는 체크리스트입니다.');
    }

    // 체크리스트 수정
    const updatedChecklist = await this.checklistRepository.update({ id: checklistId }, { ...updateChecklistDto });
    return updatedChecklist;
  }

  async delete(checklistId: number) {
    // 존재하는 체크리스트인지 확인
    const checklist = await this.checklistRepository.findOne({
      where: { id: checklistId, deletedAt: null },
      select: ['id', 'deletedAt'],
    });

    if (!checklist) {
      throw new NotFoundException('존재하지 않는 체크리스트입니다.');
    }

    // 체크리스트 삭제 (soft delete)
    await this.checklistRepository.softDelete({ id: checklistId });
    const { deletedAt } = await this.checklistRepository.findOne({
      where: { id: checklistId },
      select: ['id', 'deletedAt'],
    });

    return { deletedAt };
  }
}
