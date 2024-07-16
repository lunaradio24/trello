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
import { Readable } from 'stream';

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
  // // 첨부파일 다운로드
  // @Get(':attachmentId/download')
  // async downloadFile(@Param('attachmentId', ParseIntPipe) attachmentId: number, @Res() res: Response) {
  //   const attachment = await this.attachmentService.getAttachmentById(attachmentId);
  //
  //   if (!attachment) {
  //     return res.status(HttpStatus.NOT_FOUND).json({
  //       statusCode: HttpStatus.NOT_FOUND,
  //       message: '첨부파일을 찾을 수 없습니다.',
  //     });
  //   }
  //
  //   const fileBuffer = await this.s3Service.downloadFileFromS3(attachment.fileUrl);
  //   const fileName = attachment.fileUrl.split('/').pop();
  //   const fileExt = fileName.split('.').pop();
  //
  //   // Content-Type과 Content-Disposition 헤더 설정
  //   res.setHeader('Content-Type', `image/${fileExt}`);
  //   res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
  //
  //   // 파일 버퍼를 응답으로 전송
  //   res.send(fileBuffer);
  // }
  //
  // // 첨부파일 다운로드
  // @Get(':attachmentId/download')
  // async downloadFile(@Param('attachmentId', ParseIntPipe) attachmentId: number, @Res() res: Response) {
  //   const attachment = await this.attachmentService.getAttachmentById(attachmentId);
  //
  //   if (!attachment) {
  //     return res.status(HttpStatus.NOT_FOUND).json({
  //       statusCode: HttpStatus.NOT_FOUND,
  //       message: '첨부파일을 찾을 수 없습니다.',
  //     });
  //   }
  //
  //   const { Body, ContentType, FileName } = await this.s3Service.downloadFileFromS3(attachment.fileUrl);
  //
  //   // 다운로드를 위해 Content-Disposition 헤더 설정
  //   res.setHeader('Content-Disposition', `attachment; filename=${FileName}`);
  //   res.setHeader('Content-Type', ContentType);
  //
  //   // 파일 스트림을 응답으로 파이프
  //   Body.pipe(res);
  // }

  // 첨부파일 다운로드
  @Get(':attachmentId/download')
  async downloadFile(@Param('attachmentId', ParseIntPipe) attachmentId: number, @Res() res: Response) {
    const attachment = await this.attachmentService.getAttachmentById(attachmentId);

    if (!attachment) {
      return res.status(HttpStatus.NOT_FOUND).json({
        statusCode: HttpStatus.NOT_FOUND,
        message: '첨부파일을 찾을 수 없습니다.',
      });
    }

    const { Body, ContentType, FileName } = await this.s3Service.downloadFileFromS3(attachment.fileUrl);

    // 다운로드를 위해 Content-Disposition 헤더 설정
    res.setHeader('Content-Disposition', `attachment; filename="${FileName}"`);
    res.setHeader('Content-Type', ContentType);

    // 파일 스트림을 응답으로 파이프
    Body.pipe(res);
  }
}
