import resolveHostnames from './resolveHostnames.js';
import pingAddresses from './pingAddresses.js';

const log = console.log;

if (process.argv.length < 3) {
  log('usage: node index.js <hostname1:port1:port2:port3> | <hostname2:...> | ...');
  process.exit(1);
}

const pingTargets = process.argv.slice(2).reduce((acc, curr) => {
  const parts = curr.split(':');
  const hostname = parts[0];
  const ports = parts.slice(1).map(s => Number.parseInt(s));
  acc[hostname] = ports;
  return acc;
}, {});

log('PING TARGETS');
log(pingTargets);

const resolvedTargets = await resolveHostnames(Object.getOwnPropertyNames(pingTargets));

log('RESOLVED TARGETS');
log(resolvedTargets);

let connectionTargets = [];
let failedDns = [];

for (const resolvedTarget of resolvedTargets) {
  if (resolvedTarget.dnsError) {
    failedDns.push(resolvedTarget);
    continue;
  }
  for (const port of pingTargets[resolvedTarget.hostname]) {
    connectionTargets.push({
      port,
      ...resolvedTarget
    });
  }
}

log('CONNECTION TARGETS');
log(connectionTargets);

const pingResults = await pingAddresses(connectionTargets, 5_000);
log('PING RESULTS');
log([...pingResults, ...failedDns]);
