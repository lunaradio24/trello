import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Board } from './entities/board.entity';
import { Repository } from 'typeorm';
import { EmailService } from 'src/email/email.service';
import { User } from 'src/user/entities/user.entity';
import { BoardMember } from './entities/board-member.entity';
import { BoardMemberType } from './types/board-member.type';

@Injectable()
export class BoardService {
  redisService: any;
  constructor(
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(BoardMember)
    private boardMemberRepository: Repository<BoardMember>,
    private readonly emailService: EmailService,
  ) {}

  async create(createBoardDto: CreateBoardDto) {
    const { title, backgroundColor } = createBoardDto;
    const board = await this.boardRepository.save({
      title,
      backgroundColor,
    });
    return board;
  }

  findAll() {
    return `This action returns all board`;
  }

  findOne(id: number) {
    return `This action returns a #${id} board`;
  }

  update(id: number, updateBoardDto: UpdateBoardDto) {
    return `This action updates a #${id} board`;
  }

  remove(id: number) {
    return `This action removes a #${id} board`;
  }

  async sendVerificationEmail(boardId: number, email: string): Promise<string> {
    const user = await this.userRepository.findOne({ where: { email, deletedAt: null } });
    if (!user) {
      throw new NotFoundException(`이메일 ${email}와 맞는 유저를 찾을 수 없습니다.`);
    }

    const token = await this.emailService.sendEmailVerificationLink(email, boardId, user.id);
    await this.emailService.storeTokenData(token, boardId, user.id, email);
    console.log(boardId, typeof boardId);
    return token;
  }

  async accpetInvitation(boardId: number, token: string): Promise<number> {
    const tokenData = await this.emailService.verifyTokenData(token);

    if (typeof tokenData === 'object' && 'message' in tokenData) {
      throw new BadRequestException(tokenData.message); // 토큰이 유효하지 않거나 만료된 경우
    }

    const { userId } = tokenData;
    console.log(tokenData, typeof userId, typeof boardId);

    // boardId와 userId가 숫자인지 확인
    if (isNaN(boardId) || isNaN(userId)) {
      throw new BadRequestException('유효하지 않은 토큰 데이터입니다.');
    }

    const user = await this.userRepository.findOne({ where: { id: userId, deletedAt: null } });
    if (!user) {
      throw new NotFoundException(`없는 유저입니다.`);
    }

    const boardMember = new BoardMember();
    boardMember.boardId = boardId; // Assuming you have a specific board ID
    boardMember.memberId = user.id;
    boardMember.memberType = BoardMemberType.MEMBER; // Assuming a default member type
    await this.boardMemberRepository.save(boardMember);

    return userId; // 유효한 경우 이메일 반환
  }
}
