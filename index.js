import http from 'http';
import resolveHostnames from './resolveHostnames.js';
import pingAddresses from './pingAddresses.js';

function log(msg) {
  console.log(`${new Date(Date.now()).toISOString()}|${msg}`);
}

function error(msg) {
  console.error(`${new Date(Date.now()).toISOString()}|${msg}`);
}

function closeConnection(response, statusCode) {
  response.statusCode = statusCode;
  response.statusMessage = http.STATUS_CODES[response.statusCode];
  response.end();
}

async function ping(targets) {
  // The structure of the data should be like so:
  // {
  //   "example.org": [80, 443],
  //   "example.com": [22]
  // }
  // hence the use of `Object.getOwnPropertyNames()`

  const hostnames = Object.getOwnPropertyNames(targets);

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

  const skipCache = url.searchParams['skipCache'];
  const cacheTTL = url.searchParams['cacheTTL'];

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

    let output = {};

    try {
      output = await ping(input);
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

const port = process.env.PINGSVC_PORT || 8081;

server.listen(port);

log(`Ping service is listening on port ${port}`);
