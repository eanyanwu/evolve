import http from 'http';
import resolveHostnames from './resolveHostnames.js';
import pingAddresses from './pingAddresses.js';
import cache from './cache.js';
import { log, error, closeConnection } from './utils.js';

async function subtractCachedTargets(targets) {
  const promises = [];

  for (const [ hostname, ports ] of Object.entries(targets)) {
    for (const port of ports) {
      promises.push(cache.get(`pingsvc-${hostname}-${port}`).then((cached) => cached));
    }
  }
  const lol = await Promise.allSettled(promises);
  const cachedResults =lol.filter(p => p.status === 'fulfilled' && p.value)
                          .map(p => JSON.parse(p.value));

  for (const { hostname, port } of cachedResults) {
    const idx = targets[hostname].indexOf(port);
    if (idx > -1) {
      targets[hostname].splice(idx, 1);
    }

    if (targets[hostname].length === 0) {
      delete targets[hostname];
    }
  }
  return cachedResults;
}

function cacheResults(results, ttl) {
  const promises = [];
  for (const r of results) {
    promises.push(cache.set(`pingsvc-${r.hostname}-${r.port}`, JSON.stringify(r), ttl));
  }

  return Promise.all(promises);
}

async function ping(targets) {
  // The structure of the data should be like so:
  // {
  //   "example.org": [80, 443],
  //   "example.com": [22]
  // }
  // hence the use of `Object.keys()`
  const hostnames = Object.keys(targets);

  log(`PING REQUEST: ${hostnames.length} hostname(s)`);

  const resolvedHostnames = await resolveHostnames(hostnames);

  let connectionTargets = [];
  let failedDns = [];

  for (const resolvedHostname of resolvedHostnames) {
    if (resolvedHostname.dnsError) {
      failedDns.push(resolvedHostname);
      continue;
    }
    for (const port of targets[resolvedHostname.hostname]) {
      connectionTargets.push({
        port,
        ...resolvedHostname
      });
    }
  }

  log(`DNS: ${connectionTargets.length} valid target(s). ${failedDns.length} invalid target(s)`);

  const connectionResults = await pingAddresses(connectionTargets, 5_000);

  return [...connectionResults, ...failedDns];
}


function handleRequest(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (url.pathname !== '/ping') {
    closeConnection(response, 404);
    return;
  } 

  const skipCache = url.searchParams.get('skipCache') && 
                    url.searchParams.get('skipCache').toLowerCase() === 'true';

  const cacheTTL = Number.parseInt(url.searchParams.get('cacheTTL')) || 30;

  log(`REQUESTED ${cacheTTL}s CACHETTL`);
  
  if (skipCache) {
    log(`REQUESTED SKIP CACHE`);
  }

  let data = '';

  request.setEncoding('utf8');

  request.on('data', (chunk) => {
    data += chunk;
  });
  
  request.on('end', async () => {
    let input = {};
    
    try {
      input = JSON.parse(data);
    } catch (e) {
      error(e);
      closeConnection(response, 400);
      return;
    }

    let output;

    try {
      const cachedResults = await subtractCachedTargets(input);
      const newResults = await ping(input);
      await cacheResults(newResults, cacheTTL);
      output = [...newResults, ...cachedResults];
    } catch (e) {
      error(e);
      closeConnection(response, 500);
      return;
    }

    response.setHeader('Content-Type', 'application/json');
    response.write(JSON.stringify(output, null, 1));
    closeConnection(response, 200);
  });

  request.on('error', (err) => {
    error(err);
    closeConnection(response, 400);
  });

  response.on('error', (err) => {
    error(err);
    closeConnection(response, 500);
  });
}

const server = http.createServer(handleRequest);

export default {
  start: (port) => {
    server.listen(port);
    log(`Ping server is listening on port ${port}`);
    return server.address();
  },
  
  stop: () => server.close(),
};

