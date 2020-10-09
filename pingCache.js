import http from 'http';
import { log, error, closeConnection } from './utils.js';

const CACHE = {};

function get(key) {
  const cachedVal = CACHE[key];

  if (!cachedVal) {
    return '';
  }

  return cachedVal;
}

function set(key, value, ttl) {
  CACHE[key] = value;

  if (ttl > 0) {
    setTimeout(() => delete CACHE[key], ttl);
  }
}

function handleRequest(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  if (url.pathname !== '/cache') {
    closeConnection(response, 404);
    return;
  }

  request.setEncoding('utf8');
  
  if (request.method === 'GET') {
    const key = url.searchParams.get('key');

    const data = get(key);

    response.setHeader('Content-Type', 'text/plain');
    response.write(data);
    closeConnection(response, 200);
  } else if (request.method === 'POST') {
    const key = url.searchParams.get('key');
    const ttl = url.searchParams.get('ttl');
    let data = '';

    request.on('data', (chunk) => {
      data += chunk;
    });

    request.on('end', () => {
      set(key, data, ttl);
      closeConnection(response, 200);
    });

  } else {
    closeConnection(response, 405);
    return;
  }
}

const cacheServer = http.createServer(handleRequest);

export default {
  start: (port) => {
    cacheServer.listen(port);
    log(`Ping cache is listening on port ${port}`);
    return cacheServer.address();
  },
  stop: () => {
    cacheServer.close();
  },
};
