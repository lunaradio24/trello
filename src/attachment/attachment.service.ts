import { Repository } from 'typeorm';
import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Attachment } from './entities/attachment.entity';
import { Card } from '../card/entities/card.entity';
import { S3Service } from '../s3/s3.service';

@Injectable()
export class AttachmentService {
  constructor(
    @InjectRepository(Attachment) private readonly attachmentRepository: Repository<Attachment>,
    @InjectRepository(Card) private readonly cardRepository: Repository<Card>,
    private readonly configService: ConfigService,
    private readonly s3Service: S3Service,
  ) {}

  // 첨부파일 생성
  async createAttachment(cardId: number, file: Express.MulterS3.File): Promise<Attachment> {
    const card = await this.cardRepository.findOne({ where: { id: cardId } });
    if (!card) {
      throw new NotFoundException('카드를 찾을 수 없습니다.');
    }
    const { originalname } = file;
    const fileExt = originalname.split('.').pop();
    const fileName = originalname.slice(0, -(fileExt.length + 1));
    const uniqueFileName = `${Date.now()}_${fileName}.${fileExt}`;
    let fileUrl: string;
    try {
      fileUrl = await this.s3Service.imageUploadToS3(uniqueFileName, file, fileExt);
    } catch (error) {
      throw new InternalServerErrorException('파일 업로드에 실패했습니다.');
    }
    const savedAttachment = await this.attachmentRepository.save(
      this.attachmentRepository.create({
        cardId,
        fileUrl,
        fileName: uniqueFileName,
      }),
    );
    return savedAttachment;
  }

  // 첨부파일 삭제
  async deleteAttachment(attachmentId: number): Promise<{ attachmentId: number; cardId: number; fileName: string }> {
    const attachment = await this.attachmentRepository.findOne({ where: { id: attachmentId } });
    if (!attachment) {
      throw new NotFoundException('파일을 찾을 수 없습니다.');
    }
    const { id, cardId, fileUrl, fileName } = attachment;
    try {
      await this.s3Service.deleteFileFromS3(fileUrl);
    } catch (error) {
      throw new BadRequestException('파일 삭제에 실패했습니다.');
    }
    await this.attachmentRepository.remove(attachment);
    return {
      cardId,
      attachmentId: id,
      fileName,
    };
  }

  // 첨부파일 다운로드
  async getAttachmentById(
    attachmentId: number,
  ): Promise<{ cardId: number; attachmentId: number; fileName: string; fileUrl: string; createdAt: Date }> {
    const attachment = await this.attachmentRepository.findOne({ where: { id: attachmentId } });
    if (!attachment) {
      throw new NotFoundException('첨부파일을 찾을 수 없습니다.');
    }
    const fileKey = decodeURIComponent(attachment.fileUrl.split('/').pop());
    const fileUrl = await this.s3Service.getFileUrl(fileKey);
    return {
      cardId: attachment.cardId,
      attachmentId: attachment.id,
      fileName: decodeURIComponent(attachment.fileName),
      fileUrl: fileUrl,
      createdAt: attachment.createdAt,
    };
  }
}
