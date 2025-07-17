import {
  UseGuards,
  Controller,
  Post,
  Body,
  Get,
  Param,
  NotFoundException,
  Req,
  Patch,
  UsePipes,
  ValidationPipe,
  ConflictException,
  HttpCode,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './user.entity';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { UpdateUserDto } from './dto/update-user.dto'; //

interface RequestWithUser extends Request {
  user: User;
}
// @Controller() 데코레이터는 이 컨트롤러가 처리할 기본 경로(prefix)를 정의합니다.
// 여기서는 '/users' 경로에 대한 요청을 이 컨트롤러가 처리하게 됩니다.
@Controller('users')
export class UserController {
  // 생성자를 통해 UserService를 주입(Inject)받습니다.
  // 이로 인해 컨트롤러 내에서 UserService의 메서드를 사용할 수 있습니다.
  constructor(private readonly userService: UserService) {}


   @Post('check-id')
  @HttpCode(200) // 성공 시 200 OK 반환
  async checkUserId(@Body('id') id: string) {
    const user = await this.userService.findById(id);
    if (user) {
      // 아이디가 이미 존재하면 409 Conflict 에러 발생
      throw new ConflictException('이미 사용 중인 아이디입니다.');
    }
    // 존재하지 않으면 성공 메시지 반환
    return { message: '사용 가능한 아이디입니다.' };
  }

  /**
   * (신규) 닉네임 중복 확인
   */
  @Post('check-username')
  @HttpCode(200)
  async checkUsername(@Body('username') username: string) {
    const user = await this.userService.findByUsername(username);
    if (user) {
      throw new ConflictException('이미 사용 중인 닉네임입니다.');
    }
    return { message: '사용 가능한 닉네임입니다.' };
  }

   @Post('check-email')
  @HttpCode(200)
  async checkEmail(@Body('email') email: string) {
    const user = await this.userService.findByEmail(email); //
    if (user) {
      throw new ConflictException('이미 사용 중인 이메일입니다.');
    }
    return { message: '사용 가능한 이메일입니다.' };
  }

  /**
   * 새로운 유저를 생성합니다.
   * HTTP POST /users 요청을 처리합니다.
   * @Body() 데코레이터는 요청의 본문(body)을 DTO 객체로 변환해줍니다.
   */

  @Post()
  async createUser(
    @Body() createUserDto: CreateUserDto,
  ): Promise<Omit<User, 'password' | 'hashedRefreshToken'>> {
    return this.userService.createUser(createUserDto);
  }

  /**
   * 특정 ID를 가진 유저를 조회합니다.
   * HTTP GET /users/:id 요청을 처리합니다.
   * @Param('id') 데코레이터는 URL 경로에서 'id' 파라미터 값을 추출합니다.
   */
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getMyInfo(@Req() req: RequestWithUser) {
    // 이전에 만든 RequestWithUser 타입 사용

    // ↓↓↓↓↓↓ 2번 로그: 컨트롤러에 도착한 데이터 ↓↓↓↓↓↓
    console.log('[2. UserController] req.user에 담긴 데이터:', req.user);

    return req.user;
  }

  @Get(':id')
  async findUserById(
    @Param('id') id: string,
  ): Promise<Omit<User, 'password' | 'hashedRefreshToken'>> {
    // 1. 디버깅을 위해 어떤 ID로 요청이 들어왔는지 서버 콘솔에 로그를 남깁니다.
    //    trim()을 사용하여 파라미터의 양쪽 공백을 제거합니다.
    const trimmedId = id.trim();
    console.log(
      `[UserController] findUserById가 호출되었습니다. ID: ${trimmedId}`,
    );

    const user = await this.userService.findById(trimmedId);

    // 2. 서비스에서 유저를 찾지 못하면(null 반환), 404 에러를 발생시킵니다.
    if (!user) {
      console.log(
        `[UserController] 데이터베이스에서 ID '${trimmedId}'를 가진 유저를 찾지 못했습니다.`,
      );
      throw new NotFoundException(`User with ID "${trimmedId}" not found`);
    }

    // 3. 보안을 위해, 찾은 user 객체에서 password와 hashedRefreshToken을 제거합니다.
    const { password, hashedRefreshToken, ...result } = user;

    console.log(`[UserController] 유저를 찾았습니다:`, result);

    // 4. 안전한 정보만 담긴 result 객체를 반환합니다.
    return result;
  }

   @UseGuards(AuthGuard('jwt'))
  @Patch('me')
  @UsePipes(new ValidationPipe()) // DTO 유효성 검사를 자동으로 실행합니다.
  async updateMyInfo(
    @Req() req: RequestWithUser,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<Omit<User, 'password' | 'hashedRefreshToken'>> {
    const userId = req.user.id;
    console.log(`[UserController] updateMyInfo 호출. ID: ${userId}, 변경할 닉네임: ${updateUserDto.username}`);
    return this.userService.updateUser(userId, updateUserDto);
  }


}
