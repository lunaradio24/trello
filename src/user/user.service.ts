import { Repository } from 'typeorm';
import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateMeDto } from './dto/update-me.dto';
import { compare, hash } from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { UpdatePasswordDto } from './dto/update-password.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  async findByEmail(email: string) {
    return await this.userRepository.findOneBy({ email });
  }

  async findOneById(id: number) {
    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    return user;
  }

  async verifyPassword(userId: number, password: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'password'],
    });

    const isMatched = await compare(password, user.password);
    return isMatched;
  }

  async updateUserImage(userId: number, imageUrl: string): Promise<void> {
    const user = await this.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.image = imageUrl;
    await this.userRepository.save(user);
  }

  async updateMe(userId: number, updateMeDto: UpdateMeDto): Promise<Omit<User, 'password'>> {
    const { password, ...restUpdateMeDto } = updateMeDto;

    // 비밀번호 일치여부 확인
    const isMatched = await this.verifyPassword(userId, password);
    if (!isMatched) {
      throw new UnauthorizedException('비밀번호가 일치하지 않습니다.');
    }

    // 수정할 내용을 최소 하나 이상 입력했는지 확인
    const dtoLength = Object.keys(restUpdateMeDto).length;
    if (dtoLength === 0) {
      throw new BadRequestException('수정할 내용을 최소 하나 이상 입력해주세요.');
    }

    // 수정된 정보 업데이트
    await this.userRepository.update({ id: userId }, { ...restUpdateMeDto });

    // 수정된 내 정보 반환
    return await this.findOneById(userId);
  }

  async updatePassword(userId: number, updatedPasswordDto: UpdatePasswordDto) {
    const { currPassword, newPassword } = updatedPasswordDto;

    // 비밀번호 일치여부 확인
    const isMatched = await this.verifyPassword(userId, currPassword);
    if (!isMatched) {
      throw new UnauthorizedException('비밀번호가 일치하지 않습니다.');
    }

    // 비밀번호 돌려막기 차단
    if (currPassword === newPassword) {
      throw new BadRequestException('기존 비밀번호와 동일하게 변경할 수 없습니다.');
    }

    // 새 비밀번호 해싱
    const hashRounds = Number(this.configService.get('HASH_ROUNDS'));
    const hashedNewPassword = await hash(newPassword, hashRounds);

    // DB의 비밀번호를 새 비밀번호로 수정
    await this.userRepository.update({ id: userId }, { password: hashedNewPassword });

    // 수정 날짜 반환
    const { updatedAt } = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'updatedAt'],
    });

    return { updatedAt };
  }
}
