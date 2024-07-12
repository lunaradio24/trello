import { Inject, Injectable, Logger } from '@nestjs/common';
import { RedisClientType } from 'redis';

@Injectable()
export class redisStrategy {
  private readonly logger = new Logger(redisStrategy.name);

  constructor(@Inject('REDIS') private readonly redisClient: RedisClientType) {
    this.redisClient.on('error', (error) => {
      this.logger.error('Redis Client Error', error);
    });
  }

  async set(key: string, value: string, p0: string, expireInSeconds: number): Promise<void> {
    await this.redisClient.set(key, value, {
      EX: expireInSeconds,
    });
  }

  async get(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }

  async del(key: string): Promise<void> {
    await this.redisClient.del(key);
  }
}
