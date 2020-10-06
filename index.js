import http from 'http';
import resolveHostnames from './resolveHostnames.js';
import pingAddresses from './pingAddresses.js';

async function ping(targets) {
  const resolvedTargets = await resolveHostnames(Object.getOwnPropertyNames(targets));

  let connectionTargets = [];
  let failedDns = [];

  for (const resolvedTarget of resolvedTargets) {
    if (resolvedTarget.dnsError) {
      failedDns.push(resolvedTarget);
      continue;
    }
    for (const port of targets[resolvedTarget.hostname]) {
      connectionTargets.push({
        port,
        ...resolvedTarget
      });
    }
  }

  const connectionResults = await pingAddresses(connectionTargets, 5_000);

  return [...connectionResults, ...failedDns];
}

function handleRequest(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  if (url.pathname !== '/ping') {
    response.statusCode = 404;
    response.statusMessage = http.STATUS_CODES[response.statusCode];
    response.end();
  } else {
    const skipCache = url.searchParams['skipCache'];
    const cacheTTL = url.searchParams['cacheTTL'];

    let data = '';

    request.setEncoding('utf8');

    request.on('data', (chunk) => {
      data += chunk;
    });
    
    request.on('error', (err) => {
      console.log('Error reading request body');
      console.log(err);
    });
    
    request.on('end', async () => {
      let input = JSON.parse(data);
      let output = await ping(input);
      response.write(JSON.stringify(output, null, 1));
      response.statusCode = 200;
      response.statusMessage = http.STATUS_CODES[response.statustCode];
      response.end();
    });
  }
}

const server = http.createServer(handleRequest);

server.listen(8081);
