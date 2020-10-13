import PingServer from './pingServer.js';
import CacheServer from './cacheServer.js';

let ping = new PingServer(8080);
let cache = new CacheServer(8081);


