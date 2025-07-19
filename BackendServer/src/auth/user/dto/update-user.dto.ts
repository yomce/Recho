import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class UpdateUserDto {
  /**
   * 새로운 닉네임
   * @description 변경할 사용자의 닉네임입니다. (1~50자)
   * @example "새로운닉네임123"
   */
  @IsString({ message: '닉네임은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '닉네임은 비워둘 수 없습니다.' })
  @MaxLength(50, { message: '닉네임은 50자를 초과할 수 없습니다.' })
  username: string;

  @IsString()
  intro?: string;

  @IsString()
  profileUrl?: string;
}
