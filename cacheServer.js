import SimpleHTTPServer from './simpleHTTPServer.js';
import InMemoryCache from './inMemoryCache.js';

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
    const ttl = Number.parseInt(searchParams.get('ttl'), 10);

    if (!key || !value || !ttl) {
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

export default function CacheServer(port) {
  const cache = new InMemoryCache();
  const server = new SimpleHTTPServer({
    port: port,
    name: 'Cache Server',
  }, (args) => {
    handleRequest(cache, args);
  });

  this.address = server.getAddress();
  this.stop = (callback) => server.close(callback);
};
