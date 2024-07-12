import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRedisClient } from 'src/utils/redis.util';

@Injectable()
export class RedisService {
  private redis: any;

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get('REDIS_HOST');
    const redisToken = this.configService.get('REDIS_TOKEN');
    this.redis = createRedisClient(redisUrl, redisToken);
  }

  async set(key: string, value: string): Promise<void> {
    await this.redis.set(key, value);
  }

  async setcode(key: string, value: number): Promise<void> {
    await this.redis.set(key, value);
  }

  async expireAt(key: string, timestamp: number): Promise<void> {
    await this.redis.expireat(key, timestamp);
  }

  async get(key: string): Promise<number> {
    return await this.redis.get(key);
  }

  async del(key: string): Promise<number> {
    return await this.redis.del(key);
  }
}
