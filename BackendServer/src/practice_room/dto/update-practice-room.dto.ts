import { PartialType } from "@nestjs/mapped-types";
import { CreatePracticeRoomDto } from './create-practice-room.dto'

export class UpdatePracticeRoomDto extends PartialType (CreatePracticeRoomDto) {}