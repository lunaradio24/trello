import { Redis } from '@upstash/redis';

export const createRedisClient = (url: string, token: string) => {
  return new Redis({ url, token });
};
