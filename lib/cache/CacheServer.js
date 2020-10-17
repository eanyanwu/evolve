import SimpleHTTPServer from '../http/SimpleHTTPServer.js';
import InMemoryCache from './InMemoryCache.js';

function handleRequest(cache, { method, path, searchParams, res }) {
  if (path !== '/cache') {
    res.writeHead(404);
    res.end();
    return;
  } else if (method === 'GET') {
    const key = searchParams.get('key');
    if (!key) {
      res.writeHead(400);
      res.end();
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.write(cache.get(key));
    res.end();
    return;
  } else if (method === 'POST') {
    const key = searchParams.get('key');
    const value = searchParams.get('value');
    const ttl = Number.parseInt(searchParams.get('ttl'), 10) || 0;

    if (!key || !value) {
      res.writeHead(400);
      res.end();
      return;
    }

    try {
      cache.set(key, value, ttl);
    } catch {
      res.writeHead(400);
      res.end();
      return;
    }

    res.writeHead(200);
    res.end();
    return;
  } else {
    res.writeHead(405);
    res.end();
    return;
  }
}

export default function CacheServer(serverArgs) {
  const cache = new InMemoryCache();
  const server = new SimpleHTTPServer(
    {
      ...serverArgs,
      name: 'Cache Server',
    },
    (requestArgs) => {
      handleRequest(cache, requestArgs);
    }
  );

  this.address = server.getAddress();
  this.stop = (callback) => server.stop(callback);
}
