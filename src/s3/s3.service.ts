import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

@Injectable()
export class S3Service {
  s3Client: S3Client;
  awsS3Region: string;
  awsS3Bucket: string;
  awsS3AccessKey: string;
  awsS3SecretKey: string;

  constructor(private configService: ConfigService) {
    this.awsS3AccessKey = this.configService.get('AWS_S3_ACCESS_KEY_ID');
    this.awsS3SecretKey = this.configService.get('AWS_S3_SECRET_ACCESS_KEY');
    this.awsS3Region = this.configService.get('AWS_S3_REGION');
    this.awsS3Bucket = this.configService.get('AWS_S3_BUCKET_NAME');
    // AWS S3 클라이언트 초기화. 환경 설정 정보를 사용하여 AWS 리전, Access Key, Secret Key를 설정.
    this.s3Client = new S3Client({
      region: this.awsS3Region, // AWS Region
      credentials: {
        accessKeyId: this.awsS3AccessKey, // Access Key
        secretAccessKey: this.awsS3SecretKey, // Secret Key
      },
    });
  }

  async imageUploadToS3(
    fileName: string, // 업로드될 파일의 이름
    file: Express.Multer.File, // 업로드할 파일
    ext: string, // 파일 확장자/
  ) {
    // AWS S3에 이미지 업로드 명령을 생성합니다. 파일 이름, 파일 버퍼, 파일 접근 권한, 파일 타입 등을 설정합니다.
    const command = new PutObjectCommand({
      Bucket: this.awsS3Bucket, // S3 버킷 이름
      Key: fileName, // 업로드될 파일의 이름
      Body: file.buffer, // 업로드할 파일
      ACL: 'public-read', // 파일 접근 권한
      ContentType: `image/${ext}`, // 파일 타입
    });
    const fileUrl = `https://s3.${this.awsS3Region}.amazonaws.com/${this.awsS3Bucket}/${fileName}`;

    // 생성된 명령을 S3 클라이언트에 전달하여 이미지 업로드를 수행합니다.
    await this.s3Client.send(command);

    // 업로드된 이미지의 URL을 반환합니다.
    return fileUrl;
  }

  async deleteFileFromS3(fileUrl: string) {
    const fileName = fileUrl.split('/').pop();

    const command = new DeleteObjectCommand({
      Bucket: this.awsS3Bucket,
      Key: fileName,
    });

    await this.s3Client.send(command);
  }
}
