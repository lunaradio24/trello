import { Repository } from 'typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Attachment } from './entities/attachment.entity';
import { Card } from '../card/entities/card.entity';
import { S3Service } from '../s3/s3.service'; // S3Service 임포트

@Injectable()
export class AttachmentService {
  constructor(
    @InjectRepository(Attachment) private readonly attachmentRepository: Repository<Attachment>,
    @InjectRepository(Card) private readonly cardRepository: Repository<Card>,
    private readonly configService: ConfigService,
    private readonly s3Service: S3Service, // S3Service 주입
  ) {}

  async createAttachment(cardId: number, fileUrl: string): Promise<void> {
    const card = await this.cardRepository.findOne({ where: { id: cardId } });

    if (!card) {
      throw new NotFoundException('카드를 찾을 수 없습니다.');
    }
    const attachment = this.attachmentRepository.create({
      cardId,
      fileUrl,
    });
    await this.attachmentRepository.save(attachment);
  }

  async deleteAttachment(cardId: number, attachmentId: number): Promise<void> {
    const attachment = await this.attachmentRepository.findOne({ where: { id: attachmentId, cardId } });

    if (!attachment) {
      throw new NotFoundException('파일을 찾을 수 없습니다.');
    }

    // S3에서 파일 삭제
    await this.s3Service.deleteFileFromS3(attachment.fileUrl);

    // 데이터베이스에서 파일 정보 삭제
    await this.attachmentRepository.remove(attachment);
  }

  async getAttachmentsByCardId(cardId: number): Promise<Attachment[]> {
    const attachments = await this.attachmentRepository.find({ where: { cardId } });
    if (!attachments || attachments.length === 0) {
      throw new NotFoundException('첨부파일을 찾을 수 없습니다.');
    }
    return attachments;
  }

  async getAttachmentById(attachmentId: number): Promise<Attachment> {
    const attachment = await this.attachmentRepository.findOne({ where: { id: attachmentId } });
    if (!attachment) {
      throw new NotFoundException('첨부파일을 찾을 수 없습니다.');
    }
    return attachment;
  }
}
