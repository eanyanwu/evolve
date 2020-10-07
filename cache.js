import redis from 'redis';
import { promisify } from 'util';

const host = process.env.PINGSVC_REDIS_HOST || '127.0.0.1';
const port = process.env.PINGSVC_REDIS_PORT || 6379;

const client = redis.createClient({ host, port });

const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);

export default {
  set: (key, value, ttl) => {
    return setAsync(key, value, 'EX', ttl);
  },

  get: (key) => {
    return getAsync(key);
  }
};
