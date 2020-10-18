import CacheServer from './lib/cache/CacheServer.js';

const host = process.env.EV_CACHE_HOST || 'localhost';
const port = process.env.EV_CACHE_PORT || 8081;

new CacheServer({ host, port });
