import server from './pingServer.js';
import pingCache from './pingCache.js';

server.start(8081);
pingCache.start(8082);
