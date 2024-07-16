import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Patch,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { UpdateMeDto } from './dto/update-me.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { S3Service } from '../s3/s3.service';
import { ApiTags } from '@nestjs/swagger';
import { UpdatePasswordDto } from './dto/update-password.dto';

@ApiTags('Users')
@Controller('users/me')
@UseGuards(AccessTokenGuard)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly s3Service: S3Service,
  ) {}

  /** 내 정보 조회 */
  @Get()
  async findMe(@Request() req) {
    const userId = req.user.id;
    const data = await this.userService.findOneById(userId);

    return {
      statusCode: HttpStatus.OK,
      message: '내 정보 조회에 성공했습니다.',
      data,
    };
  }

  /** 비밀번호 변경 */
  @Patch('update-password')
  async updatePassword(@Request() req: any, @Body() updatePasswordDto: UpdatePasswordDto) {
    const userId = req.user.id;
    const { updatedAt } = await this.userService.updatePassword(userId, updatePasswordDto);
    return {
      status: HttpStatus.OK,
      message: '비밀번호 수정에 성공했습니다.',
      data: { updatedAt },
    };
  }

  /** 내 정보 수정 */
  @Patch('update')
  async updateMe(@Request() req: any, @Body() updateMeDto: UpdateMeDto) {
    const userId = req.user.id;
    const updatedMe = await this.userService.updateMe(userId, updateMeDto);
    return {
      statusCode: HttpStatus.OK,
      message: '내 정보 수정에 성공했습니다.',
      data: updatedMe,
    };
  }

  /** 프로필 이미지 업데이트 */
  @Post('update-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@Request() req, @UploadedFile() file: Express.MulterS3.File) {
    const userId = req.user.id;

    const [fileName, fileExt] = file.originalname.split('.');
    const fileUrl = await this.s3Service.imageUploadToS3(`${Date.now()}_${fileName}`, file, fileExt);

    const updatedMe = await this.userService.updateUserImage(userId, fileUrl);

    return {
      statusCode: HttpStatus.OK,
      message: '이미지 업로드에 성공했습니다.',
      fileUrl, // the URL of the uploaded file in S3
    };
  }
}
