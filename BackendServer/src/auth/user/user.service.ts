import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity'; // 경로 수정
import { CreateUserDto } from './dto/create-user.dto'; // 경로 수정
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto'; // [1] UpdateUserDto import
import { ImageService } from 'src/image/image.service';
import { UserResponseDto } from './dto/user.response.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly imageService: ImageService,
  ) {}

  async internalFindById(id: string): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }

  async publicFindById(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    let userProfileSignedUrl: string | null = null;
    if (user && user.profileUrl) {
      userProfileSignedUrl = await this.imageService.getDownloadUrl(
        user.profileUrl,
      );
    }
    const userResponse = UserResponseDto.from(user);
    userResponse.profileImageUrl = userProfileSignedUrl;

    return userResponse;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOneBy({ username });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOneBy({ email });
  }

  async createUser(
    createUserDto: CreateUserDto,
  ): Promise<Omit<User, 'password' | 'hashedRefreshToken'>> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const newUser = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });
    const savedUser = await this.userRepository.save(newUser);
    // 보안을 위해 비밀번호 관련 필드는 제외하고 반환
    const { password, hashedRefreshToken, ...result } = savedUser;
    return result;
  }

  async findByProviderId(
    provider: string,
    providerId: string,
  ): Promise<User | null> {
    return this.userRepository.findOne({
      where: { provider, providerId },
    });
  }

  async createWithProvider(details: {
    provider: string;
    providerId: string;
    email: string;
    username: string;
  }): Promise<User> {
    const newUser = this.userRepository.create({
      id: details.providerId,
      username: details.username,
      email: details.email,
      provider: details.provider,
      providerId: details.providerId,
    });
    return this.userRepository.save(newUser);
  }

  async updatePassword(id: string, newHashedPassword: string): Promise<void> {
    const user = await this.userRepository.findOneBy({ id: id });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    user.password = newHashedPassword;
    await this.userRepository.save(user);
  }

  async setCurrentRefreshToken(
    id: string,
    refreshToken: string | null,
  ): Promise<void> {
    await this.userRepository.update(id, {
      hashedRefreshToken: refreshToken,
    });
  }

  /**
   * [2] 사용자 정보 업데이트 메서드 추가
   * @param id 사용자 ID
   * @param updateUserDto 업데이트할 정보
   * @returns 업데이트된 사용자 정보 (비밀번호 제외)
   */
  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`ID가 '${id}'인 사용자를 찾을 수 없습니다.`);
    }

    // DTO에 담긴 정보로 사용자 닉네임 업데이트
    user.username = updateUserDto.username;
    if (updateUserDto.intro) {
      user.intro = updateUserDto.intro;
    }
    if (updateUserDto.profileUrl) {
      // 1. ImageService를 사용하여 이미지 정보를 저장합니다.
      //    이때 DTO의 profileUrl은 S3에 저장된 파일의 'key'라고 가정합니다.
      const savedImage = await this.imageService.saveProfileImage(
        updateUserDto.profileUrl,
      );

      // 2. 저장된 이미지의 imageUrl을 사용자 정보에 연결합니다.
      //    imageUrl은 S3 버킷의 절대 경로가 포함된 URL입니다.
      user.profileUrl = savedImage.imageKey;
    }

    const updatedUser = await this.userRepository.save(user);

    // 보안을 위해 민감 정보 제외 후 반환
    return updatedUser;
  }
}
