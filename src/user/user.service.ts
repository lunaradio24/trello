import { Repository } from 'typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateMeDto } from './dto/update-me.dto';
import { hash } from 'bcrypt';
import { ConfigService } from '@nestjs/config';

import { User } from './entities/user.entity';

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

  // 내 정보 수정
  async updateMe(userId: number, updateMeDto: UpdateMeDto): Promise<Omit<User, 'password'>> {
    await this.findOneById(userId);
    const { password, nickname, bio, image } = updateMeDto;

    // 비밀번호 해싱
    const hashRounds = Number(this.configService.get('HASH_ROUNDS'));
    const hashedPassword = await hash(password, hashRounds);

    // 수정된 정보 업데이트
    await this.userRepository.update(userId, {
      ...{ password: hashedPassword },
      nickname,
      bio,
      image,
    });
    const updatedMe = await this.findOneById(userId);

    // 비밀번호 제외 후 반환
    const { password: _, ...updateUserWithoutPassword } = updatedMe;
    return updateUserWithoutPassword;
  }

  //
}
