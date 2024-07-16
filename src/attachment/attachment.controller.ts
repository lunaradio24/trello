import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AttachmentService } from './attachment.service';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { S3Service } from '../s3/s3.service';
import { ApiTags } from '@nestjs/swagger';
import { CreateAttachmentDto } from './dto/create-attachment.dto';

@ApiTags('Attachment')
@Controller('cards/:cardId/attachment')
@UseGuards(AccessTokenGuard)
export class AttachmentController {
  constructor(
    private readonly attachmentService: AttachmentService,
    private readonly s3Service: S3Service,
  ) {}

  @Get('')
  async getAttachments(@Param('cardId', ParseIntPipe) cardId: number) {
    const attachments = await this.attachmentService.getAttachmentsByCardId(cardId);
    return {
      statusCode: HttpStatus.OK,
      message: '첨부파일 조회에 성공했습니다.',
      attachments,
    };
  }

  // 첨부파일 업로드
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Param('cardId', ParseIntPipe) cardId: number,
    @Request() req: any,
    @UploadedFile() file: Express.MulterS3.File,
  ) {
    const [fileName, fileExt] = file.originalname.split('.');
    const fileUrl = await this.s3Service.imageUploadToS3(`${Date.now()}_${fileName}`, file, fileExt);

    const createFile = await this.attachmentService.createAttachment(cardId, fileUrl);
    return {
      statusCode: HttpStatus.OK,
      message: '첨부파일 업로드에 성공했습니다.',
      fileUrl,
    };
  }

  @Delete(':attachmentId')
  async deleteFile(
    @Param('cardId', ParseIntPipe) cardId: number,
    @Param('attachmentId', ParseIntPipe) attachmentId: number,
  ) {
    await this.attachmentService.deleteAttachment(cardId, attachmentId);
    return {
      statusCode: HttpStatus.OK,
      message: '첨부파일 삭제에 성공했습니다.',
    };
  }
}
