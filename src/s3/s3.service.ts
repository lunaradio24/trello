import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

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
    this.s3Client = new S3Client({
      region: this.awsS3Region,
      credentials: {
        accessKeyId: this.awsS3AccessKey,
        secretAccessKey: this.awsS3SecretKey,
      },
    });
  }

  // 첨부파일, 프로필 이미지 업로드
  async imageUploadToS3(fileName: string, file: Express.Multer.File, ext: string) {
    const command = new PutObjectCommand({
      Bucket: this.awsS3Bucket,
      Key: fileName,
      Body: file.buffer,
      ACL: 'public-read',
    });
    const fileUrl = `https://s3.${this.awsS3Region}.amazonaws.com/${this.awsS3Bucket}/${fileName}`;
    await this.s3Client.send(command);
    return fileUrl;
  }

  // 첨부 파일 삭제
  async deleteFileFromS3(fileUrl: string) {
    const fileName = fileUrl.split('/').pop();
    const command = new DeleteObjectCommand({
      Bucket: this.awsS3Bucket,
      Key: fileName,
    });
    await this.s3Client.send(command);
  }

  // 첨부파일 URL 응답
  async getFileUrl(fileKey: string): Promise<string> {
    return `https://${this.awsS3Bucket}.s3.${this.awsS3Region}.amazonaws.com/${encodeURIComponent(fileKey)}`;
  }
}
