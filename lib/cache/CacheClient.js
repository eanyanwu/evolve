import util from 'util';
import { requestAsync } from '../http/request.js';

/**
 * Client for accessing an http cache server
 */
export default function CacheClient({ host, port }) {
  this.host = host;
  this.port = port;
}

CacheClient.prototype.get = async function (key) {
  const { statusCode, data } = await requestAsync({
    host: this.host,
    port: this.port,
    method: 'GET',
    path: `/cache?key=${key}`,
  });

  if (statusCode !== 200) {
    throw new Error(`(${statusCode}) Could not read cache\n(${key})`);
  }

  return data.toString();
};

CacheClient.prototype.set = async function (key, value, ttl) {
  const { statusCode } = await requestAsync({
    host: this.host,
    port: this.port,
    method: 'POST',
    path: `/cache?key=${key}&value=${value}&ttl=${ttl}`,
  });

  if (statusCode !== 200) {
    const msg = `(${statusCode}) Could not write to cache\n(${key},${value},${ttl})`;
    throw new Error(msg);
  }
};
