import PingServer from './pingServer.js';
import CacheServer from './cacheServer.js';

const pingServerHost = 'localhost';
const pingServerPort = 8080;
const cacheHost = 'localhost';
const cachePort = 8081;

let ping = new PingServer({
  pingServerHost,
  pingServerPort,
  cacheHost,
  cachePort,
});

let cache = new CacheServer({
  host: cacheHost,
  port: cachePort,
});


