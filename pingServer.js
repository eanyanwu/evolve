import InMemoryCache from './inMemoryCache.js';
import SimpleHTTPServer from './simpleHTTPServer.js';
import resolveHostnames from './resolveHostnames.js';
import pingAddresses from './pingAddresses.js';
import { log, error } from './utils.js';

const cache = new InMemoryCache();

function subtractCachedTargets(targets) {
  const cacheResults = [];

  for (const [ hostname, ports ] of Object.entries(targets)) {
    for (const port of ports) {
      cacheResults.push(cache.get(`pingsvc-${hostname}-${port}`));
    }
  }

  const cacheHits = cacheResults.filter(r => r).map(h => JSON.parse(h));

  for (const { hostname, port } of cacheHits) {
    const idx = targets[hostname].indexOf(port);
    if (idx > -1) {
      targets[hostname].splice(idx, 1);
    }

    if (targets[hostname].length === 0) {
      delete targets[hostname];
    }
  }
  return cacheHits;
}

function cacheResults(results, ttl) {
  for (const r of results) {
    cache.set(`pingsvc-${r.hostname}-${r.port}`, JSON.stringify(r), ttl);
  }
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


async function handleRequest({ method , path, searchParams, body, res }) {
  if (path !== '/ping') {
    res.writeHead(404);
    res.end();
    return;
  } 

  const skipCache = searchParams.get('skipCache') && 
                    searchParams.get('skipCache').toLowerCase() === 'true';

  const cacheTTL = Number.parseInt(searchParams.get('cacheTTL'), 10) || (30 * 1000);

  let input = {};

  try {
    input = JSON.parse(body.toString());
  } catch (e) {
    error(e);
    res.writeHead(400);
    res.end();
    return;
  }

  let output;

  try {
    const cachedResults = subtractCachedTargets(input);
    const newResults = await ping(input);
    cacheResults(newResults, cacheTTL);
    output = [...newResults, ...cachedResults];
  } catch (e) {
    error(e);
    res.writeHead(500);
    res.end();
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.write(JSON.stringify(output, null, 1));
  res.end();
}

export default function PingServer(port) {
  const server = new SimpleHTTPServer({
    port: port,
    name: 'Ping Server'
  }, handleRequest);

  this.address = server.getAddress();
  this.stop = (callback) => server.close(callback);
};
