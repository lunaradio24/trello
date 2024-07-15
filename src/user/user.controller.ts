import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Patch,
  Post,
  Request,
  Response,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { UpdateMeDto } from './dto/update-me.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { S3Service } from '../s3/s3.service';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly s3Service: S3Service,
  ) {}

  @UseGuards(AccessTokenGuard)
  @Get('/me')
  async findMe(@Request() req) {
    const userId = req.user.id;
    const data = await this.userService.findOneById(userId);

    return {
      statusCode: HttpStatus.OK,
      message: '내 정보 조회에 성공했습니다.',
      data,
    };
  }

  @UseGuards(AccessTokenGuard)
  @Post('/image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@Request() req, @UploadedFile() file: Express.MulterS3.File) {
    const userId = req.user.id;
    console.log(file);
    const [fileName, fileExt] = file.originalname.split('.');
    const fileUrl = await this.s3Service.imageUploadToS3(`${Date.now()}_${fileName}`, file, fileExt);
    console.log(fileName);
    console.log(fileExt);
    const updatedMe = await this.userService.updateUserImage(userId, fileUrl);

    return {
      message: 'file uploaded successfully',
      fileUrl, // the URL of the uploaded file in S3
    };
  }

  @UseGuards(AccessTokenGuard)
  @Patch('me')
  @UseInterceptors(FileInterceptor('image'))
  async updateMe(@Request() req, @UploadedFile() file, @Body() updateMeDto: UpdateMeDto, @Response() res) {
    const userId = req.user.id;

    if (file) {
      console.log('File uploaded:', file); // 파일 정보 로그 출력
      updateMeDto.image = file.location; // S3 업로드 후 파일 URL 설정
    } else {
      console.log('No file uploaded');
    }

    const updatedMe = await this.userService.updateMe(userId, updateMeDto);
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: '내 정보 수정에 성공했습니다.',
      data: updatedMe,
    });
  }
}
