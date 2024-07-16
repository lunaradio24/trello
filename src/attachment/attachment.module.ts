import { Module } from '@nestjs/common';
import { AttachmentController } from './attachment.controller';
import { AttachmentService } from './attachment.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attachment } from './entities/attachment.entity';
import { Card } from '../card/entities/card.entity';
import { S3Service } from '../s3/s3.service';

@Module({
  imports: [TypeOrmModule.forFeature([Attachment, Card])],
  controllers: [AttachmentController],
  providers: [AttachmentService, S3Service],
})
export class AttachmentModule {}
