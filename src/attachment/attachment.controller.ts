import {
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AttachmentService } from './attachment.service';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { S3Service } from '../s3/s3.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Attachments')
@Controller('attachments')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard)
export class AttachmentController {
  constructor(
    private readonly attachmentService: AttachmentService,
    private readonly s3Service: S3Service,
  ) {}

  // 첨부파일 업로드
  @Post('')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@Body('cardId') cardId: number, @UploadedFile() file: Express.MulterS3.File) {
    const result = await this.attachmentService.createAttachment(cardId, file);
    return {
      status: HttpStatus.OK,
      message: '첨부파일 업로드에 성공했습니다.',
      data: result,
    };
  }

  // 첨부파일 삭제
  @Delete(':attachmentId')
  async deleteFile(@Param('attachmentId', ParseIntPipe) attachmentId: number) {
    const result = await this.attachmentService.deleteAttachment(attachmentId);
    return {
      status: HttpStatus.OK,
      message: '첨부파일 삭제에 성공했습니다.',
      data: result,
    };
  }

  // 첨부파일 URL 요청
  @Get(':attachmentId')
  async getFileUrl(@Param('attachmentId', ParseIntPipe) attachmentId: number) {
    const result = await this.attachmentService.getAttachmentById(attachmentId);
    return {
      status: HttpStatus.OK,
      message: '첨부파일 조회에 성공했습니다.',
      data: result,
    };
  }
}
