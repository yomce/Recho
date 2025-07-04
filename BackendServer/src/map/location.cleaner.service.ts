import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { LocationService } from "./location.service";


// -- 위치 정보를 사용하는 모든 테이블에서 참조하지 않는 위치 정보 데이터를 주기적으로 삭제합니다 (Hard Delete) -- 
@Injectable()
export class LocationCleanerService{
  private readonly logger = new Logger(LocationCleanerService.name);

  constructor(private readonly locationService: LocationService) {}

  // @Cron(CronExpression.EVERY_10_SECONDS)
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCleanup() {
    this.logger.log('위치 데이터 정리 시작');
    await this.locationService.cleanUpUnusedLocations();
    this.logger.log('위치 정리 작업 완료.');
  }
}