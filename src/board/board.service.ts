import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Board } from './entities/board.entity';
import { DataSource, Repository } from 'typeorm';
import { EmailService } from 'src/email/email.service';
import { User } from 'src/user/entities/user.entity';
import { BoardMember } from './entities/board-member.entity';
import { BoardMemberType } from './types/board-member.type';

@Injectable()
export class BoardService {
  redisService: any;
  connection: any;
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(BoardMember)
    private boardMemberRepository: Repository<BoardMember>,
    private readonly emailService: EmailService,
  ) {}

  async create(userId: number, createBoardDto: CreateBoardDto) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const { title, backgroundColor, description } = createBoardDto;
      // adminId를 userId로 등록
      const board = this.boardRepository.create({
        adminId: userId,
        title,
        backgroundColor,
        description,
      });
      const savingBoard = await queryRunner.manager.save(Board, board);

      const boardMember = this.boardMemberRepository.create({
        board: savingBoard,
        memberId: userId,
        memberType: BoardMemberType.ADMIN,
      });
      const savingBoardMember = await queryRunner.manager.save(BoardMember, boardMember);
      await queryRunner.commitTransaction();
      await queryRunner.release();

      return savingBoard;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      console.error(err);
      throw err;
    }
  }

  async findAll(userId: number) {
    const joinedBoardMembers = await this.boardMemberRepository.find({
      where: {
        memberId: userId,
      },
      relations: ['board'],
    });
    const joinedBoards = joinedBoardMembers.map((boardMember) => boardMember.board);
    return joinedBoards;
  }

  async findOne(boardId: number, userId: number) {
    const board = await this.boardRepository.findOne({
      where: {
        id: boardId,
        adminId: userId,
        deletedAt: null,
      },
      relations: ['lists', 'lists.cards'],
    });
    if (!board) {
      throw new NotFoundException('보드가 존재하지 않습니다.');
    }
    return board;
  }

  async update(boardId: number, userId: number, updateBoardDto: UpdateBoardDto) {
    const board = await this.boardRepository.findOne({
      where: {
        id: boardId,
        deletedAt: null,
      },
    });
    if (!board) {
      throw new NotFoundException('보드가 존재하지 않습니다.');
    }
    // board의 admin만 수정 가능
    if (userId !== board.adminId) {
      throw new UnauthorizedException('수정 권한이 없습니다.');
    }
    const updatingBoard = await this.boardRepository.update(boardId, updateBoardDto);
    const updatedBoard = await this.boardRepository.findOne({
      where: {
        id: boardId,
        deletedAt: null,
      },
    });
    return updatedBoard;
  }

  async delete(boardId: number, userId: number) {
    const board = await this.boardRepository.findOne({
      where: {
        id: boardId,
        deletedAt: null,
      },
    });
    if (!board) {
      throw new NotFoundException('보드가 존재하지 않습니다.');
    }
    // board의 admin만 삭제 가능
    if (userId !== board.adminId) {
      throw new UnauthorizedException('삭제 권한이 없습니다.');
    }
    const deletingBoard = await this.boardRepository.delete(boardId);
    return;
  }

  async sendVerificationEmail(boardId: number, email: string, userId: number): Promise<string> {
    const user = await this.userRepository.findOne({ where: { email, deletedAt: null } });
    if (!user) {
      throw new NotFoundException(`초대할 이메일 ${email}와 맞는 유저를 찾을 수 없습니다.`);
    }

    const board = await this.boardRepository.findOne({ where: { id: boardId, deletedAt: null } });
    if (!board) {
      throw new NotFoundException(`보드 ID ${boardId}를 찾을 수 없습니다.`);
    }

    // 보드의 어드민 아이디인지 확인
    if (board.adminId !== userId) {
      throw new UnauthorizedException('초대 링크를 보낼 권한이 없습니다.');
    }

    const board = await this.boardRepository.findOne({ where: { id: boardId } });
    if (!board) {
      throw new NotFoundException(`보드 ID ${boardId}를 찾을 수 없습니다.`);
    }

    // 보드의 어드민 아이디인지 확인
    if (user.id !== board.adminId) {
      throw new UnauthorizedException('초대 링크를 보낼 권한이 없습니다.');
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
