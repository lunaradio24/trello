import { Body, Controller, Get, HttpStatus, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { UpdateMeDto } from './dto/update-me.dto';
import { ApiTags } from '@nestjs/swagger';
import { UpdatePasswordDto } from './dto/update-password.dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(AccessTokenGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  /** 내 정보 조회 */
  @Get('me')
  async findMe(@Request() req: any) {
    const userId = req.user.id;
    const data = await this.userService.findOneById(userId);

    return {
      statusCode: HttpStatus.OK,
      message: '내 정보 조회에 성공했습니다.',
      data,
    };
  }

  /** 비밀번호 변경 */
  @Patch('update/password')
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
  @Patch('update/image')
  async updateMe(@Request() req: any, @Body() updateMeDto: UpdateMeDto) {
    const userId = req.user.id;
    const updatedMe = await this.userService.updateMe(userId, updateMeDto);
    return {
      statusCode: HttpStatus.OK,
      message: '내 정보 수정에 성공했습니다.',
      data: updatedMe,
    };
  }
}
