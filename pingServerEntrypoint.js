import PingServer from './lib/ping/PingServer.js';

const host = process.env.EV_PING_HOST || 'localhost';
const port = process.env.EV_PING_PORT || 8080;

const cacheHost = process.env.EV_CACHE_HOST || 'localhost';
const cachePort = process.env.EV_CACHE_PORT || 8081;

let ping = new PingServer({
  host,
  port,
}, {
  host: cacheHost,
  port: cachePort,
});
