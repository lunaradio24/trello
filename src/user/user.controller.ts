import { Body, Controller, Get, HttpStatus, Patch, Request, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { UpdateMeDto } from './dto/update-me.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

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
  @Patch('/me')
  async updateMe(@Request() req, @Body() updateMeDto: UpdateMeDto) {
    const userId = req.user.id;
    const updatedMe = await this.userService.updateMe(userId, updateMeDto);
    return {
      statusCode: HttpStatus.OK,
      message: '내 정보 수정에 성공했습니다.',
      data: updatedMe,
    };
  }
}
