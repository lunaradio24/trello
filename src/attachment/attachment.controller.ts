import {
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Request,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AttachmentService } from './attachment.service';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { S3Service } from '../s3/s3.service';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('Attachment')
@Controller('cards/:cardId/attachment')
@UseGuards(AccessTokenGuard)
export class AttachmentController {
  constructor(
    private readonly attachmentService: AttachmentService,
    private readonly s3Service: S3Service,
  ) {}

  // 첨부파일 목록 조회
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
  @Post('')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Param('cardId', ParseIntPipe) cardId: number,
    @Request() req: any,
    @UploadedFile() file: Express.MulterS3.File,
  ) {
    try {
      const fileExt = file.originalname.split('.').pop();
      const fileName = file.originalname.slice(0, -(fileExt.length + 1));
      const uniqueFileName = `${Date.now()}_${fileName}.${fileExt}`; // 파일 이름에 확장자 포함
      const fileUrl = await this.s3Service.imageUploadToS3(uniqueFileName, file, fileExt);
      const createFile = await this.attachmentService.createAttachment(cardId, fileUrl);
      return {
        statusCode: HttpStatus.OK,
        message: '첨부파일 업로드에 성공했습니다.',
        fileUrl,
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: '첨부파일 업로드에 실패했습니다.',
        error: error.message,
      };
    }
  }

  // 첨부파일 삭제
  @Delete(':attachmentId')
  async deleteFile(
    @Param('cardId', ParseIntPipe) cardId: number,
    @Param('attachmentId', ParseIntPipe) attachmentId: number,
  ) {
    try {
      await this.attachmentService.deleteAttachment(cardId, attachmentId);
      return {
        statusCode: HttpStatus.OK,
        message: '첨부파일 삭제에 성공했습니다.',
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: '첨부파일 삭제에 실패했습니다.',
        error: error.message,
      };
    }
  }

  // 첨부파일 URL 요청
  @Get(':attachmentId')
  async getFileUrl(@Param('attachmentId', ParseIntPipe) attachmentId: number, @Res() res: Response) {
    const attachment = await this.attachmentService.getAttachmentById(attachmentId);
    if (!attachment) {
      return res.status(HttpStatus.NOT_FOUND).json({
        statusCode: HttpStatus.NOT_FOUND,
        message: '첨부파일을 찾을 수 없습니다.',
      });
    }
    const fileKey = decodeURIComponent(attachment.fileUrl.split('/').pop());
    const fileExt = fileKey.split('.').pop();
    const fileUrl = await this.s3Service.getFileUrl(fileKey);
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      fileUrl: fileUrl,
    });
  }
}
