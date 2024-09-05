import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = createClient();
    this.isConnected = true;
    this.client.on('error', (error) => {
      console.error('Redis Client Error:', error);
      this.isConnected = false;
    });
    this.client.on('connect', () => {
      this.isConnected = true;
    });
  }

  isAlive() {
    return this.isConnected;
  }

  async get(k) {
    return promisify(this.client.GET).bind(this.client)(k);
  }

  async set(k, val, dur) {
    await promisify(this.client.SETEX)
      .bind(this.client)(k, dur, val);
  }

  async del(k) {
    await promisify(this.client.DEL).bind(this.client)(k);
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;
