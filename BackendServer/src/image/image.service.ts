import { PutObjectCommand, S3Client, S3ClientConfig } from "@aws-sdk/client-s3";
import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { Image } from "./entities/image.entity";
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import { ImageGetPresignedUrlDto, BulkImageGetPresignedUrlDto } from "./dto/image-get-presigned-url.dto";
import { ReferenceIn, UploadInfo } from "./types/image.types";
import { v4 as uuidv4 } from 'uuid';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { SaveImageDto } from "./dto/save-image.dto";

dotenv.config();

@Injectable()
export class ImageService{
  private readonly s3: S3Client;

  constructor(
    @InjectRepository(Image)
    private readonly imageRepository: Repository<Image>,
    private readonly configService: ConfigService,
  ) {
    // 1. ConfigService에서 설정값 가져오기
    const region = this.configService.get<string>('AWS_REGION');
    const accessKeyId = this.configService.get<string>(
      'AWS_BUCKET_IAM_ACCESS_KEY_ID',
    );
    const secretAccessKey = this.configService.get<string>(
      'AWS_BUCKET_IAM_SECRET_ACCESS_KEY',
    );

    if (!region || !accessKeyId || !secretAccessKey) {
      // 하나라도 없으면 서버 내부 오류 예외를 발생시켜 서버 실행을 중단
      throw new InternalServerErrorException(
        'S3 클라이언트 설정에 필요한 환경 변수가 누락되었습니다.',
      );
    }
    // 2. 요청하신 형식으로 S3 클라이언트 설정 객체 생성
    const clientConfig: S3ClientConfig = {
      region: region,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
      forcePathStyle: true,
    };

    // 3. 생성된 설정 객체를 사용해 S3 클라이언트 초기화
    this.s3 = new S3Client(clientConfig);
  }

  async getPresignedUrl(dto: ImageGetPresignedUrlDto | BulkImageGetPresignedUrlDto) : Promise<Record<ReferenceIn, UploadInfo>> {
    const bucket = this.configService.get<string>('AWS_S3_BUCKET_RECHO_IMG');
    const response: Partial<Record<ReferenceIn, UploadInfo>> = {};

    // --- 단일 요청이면 배열로 감싸고, 벌크 요청이면 items 배열을 사용한다 ---
    const items = 'items' in dto ? dto.items : [dto];

    console.log('[debug] incoming dto:', dto);
    console.log('[debug] items:', 'items' in dto ? dto.items : dto);

    const urlPromises = items.map(async (fileInfo) => {
      const { refIn, fileType, isThumbnail = false } = fileInfo;

      let keyPrefix: string;
      switch (refIn) {
        case 'USED-PRODUCTS':
          keyPrefix = this.configService.get('USED-PRODUCTS-PATH') || 'used-products';
          break;
        case 'PRACTICE-ROOM' :
          keyPrefix = this.configService.get('PRACTICE-ROOM') || 'practice-room';
          break;
        case 'ENSEMBLES' :
          keyPrefix = this.configService.get('ENSEMBLES') || 'ensembles';
          break;
        case 'USERS' :
          keyPrefix = this.configService.get('USERS') || 'users';
          break;
        default :
          throw new Error(`Invalid refIn: ${refIn}`)
      }

      const fullPrefix = isThumbnail ? `${keyPrefix}/thumbnail` : keyPrefix;

      const key = `${fullPrefix}/${uuidv4()}`;
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: fileType,
      });

      const url = await getSignedUrl(this.s3, command, { expiresIn: 300 });

      const responseKey = fileInfo.originalKey ?? `${refIn}-${isThumbnail ? 'thumbnail' : 'original'}`;
      response[responseKey] = { url, key };

      console.log('[debug] presigned:', {
        refIn,
        originalKey: responseKey,
        isThumbnail,
        key,
        url,
      });
    });
    await Promise.all(urlPromises);

    return response as Record<ReferenceIn, UploadInfo>;
  }

  async saveImages(images: SaveImageDto[]) : Promise<Image[]> {
    const imgEntities = images.map((img) => {
      const { key, refIn, isThumbnail = false } = img;

      const expectedPrefix = isThumbnail
        ? `${refIn.toLowerCase()}/thumbnail`
        : `${refIn.toLowerCase()}`;
      
      if(!key.startsWith(expectedPrefix)) {
        throw new Error(`Key "${key}" does not match expected prefix "${expectedPrefix}"`);
      }
      return this.imageRepository.create({...img, isThumbnail});
    });
    const savedImages = await this.imageRepository.save(imgEntities);
    console.log('✅ 저장된 이미지:', savedImages);
    return savedImages;
  }

  async connectImagesToPost ({
    imageIds,
    refPostId,
  } : {
    imageIds: number[];
    refPostId: number;
  }) : Promise<void> {
    const result = await this.imageRepository.update(
      { imageId: In(imageIds) },
      { refPostId },
    );
    console.log('이미지 업데이트 결과:', result);
  }

  async findImageByRefPostId(refPostId: number) : Promise<Image[]> {
    return this.imageRepository.find({
      where: {refPostId},
      order: { uploadOrder: 'ASC'},
    });
  }

  async disconnectImages(imageIds: number[]) : Promise<void> {
    await this.imageRepository.update(
      { imageId: In(imageIds) },
      { refPostId: null },
    );
  }

  // -- 메인 중괄호 --
}

