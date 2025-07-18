// src/notifications/dto/mark-as-read.dto.ts

import { IsArray, IsString, IsOptional } from 'class-validator';

export class MarkAsReadDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  notificationIds?: string[];
}
