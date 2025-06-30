// src/auth/user/user.service.ts
import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async createUser(dto: CreateUserDto): Promise<Omit<User, 'password' | 'hashedRefreshToken'>> {
    // 1. 아이디 중복 확인
    const existingUserById = await this.userRepo.findOneBy({ id: dto.id });
    if (existingUserById) {
      throw new ConflictException('이미 존재하는 아이디입니다.');
    }
    
    // 2. 이메일 중복 확인 (엔티티에 unique:true 속성이 있으므로 추가하는 것이 좋습니다)
    const existingUserByEmail = await this.userRepo.findOneBy({ email: dto.email });
    if (existingUserByEmail) {
      throw new ConflictException('이미 사용 중인 이메일입니다.');
    }

    // 3. 비밀번호 암호화
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

    // 4. 유저 생성 및 저장 (★★★★★ 여기가 수정된 부분입니다 ★★★★★)
    const user = this.userRepo.create({
      id: dto.id,
      username: dto.username, // 'dto.name'에서 'dto.username'으로 수정
      email: dto.email,       // 누락되었던 email 필드 추가
      password: hashedPassword,
    });
    
    await this.userRepo.save(user);

    // 보안을 위해 반환되는 객체에서 민감한 정보를 제거합니다.
    const { password, hashedRefreshToken, ...result } = user;
    return result;
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepo.findOneBy({ id });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOneBy({ email });
  }

  async setCurrentRefreshToken(userId: string, refreshToken: string) {
    const saltRounds = 10;
    const hashedRefreshToken = await bcrypt.hash(refreshToken, saltRounds);
    await this.userRepo.update(userId, { hashedRefreshToken });
  }

  async removeRefreshToken(userId: string): Promise<any> {
    return this.userRepo.update(userId, {
      hashedRefreshToken: null,
    });
  }
}
