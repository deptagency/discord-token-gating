import { RedisClientType } from '@redis/client';
import { RedisCommandArgument } from '@redis/client/dist/lib/commands';
import { createClient } from 'redis';

class RedisAdapter {
  static client: RedisClientType;

  private constructor() {}

  static initialize() {
    if (!this.client) {
      this.client = createClient({
        url : process.env.REDIS_URL,
        password: process.env.REDIS_PASSWORD,
        socket: {
          tls: true,
          keepAlive: 0
        }
      });
    
      this.client.on("error", err => {
        console.log("Redis Client Error", err);
        throw new Error(err.message);
      });
    }
  }

  static async set(key: RedisCommandArgument, value: RedisCommandArgument) {
    await this.client.connect();
    await this.client.set(key, value);
    return this.client.quit();
  }

  static async setAll(rows: { key: RedisCommandArgument, value: RedisCommandArgument }[]) {
    await this.client.connect();
    await Promise.all(rows.map(row => this.client.set(row.key, row.value)));
    return this.client.quit();
  }
}

export default RedisAdapter;