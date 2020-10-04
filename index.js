import { promises as dns } from 'dns';
import { performance } from 'perf_hooks';
import net from 'net';
import { Socket } from 'dgram';

const log = console.log;
const STATUS_DOWN = "DOWN";
const STATUS_UP = "UP";
const statuses = [];


if (process.argv.length !== 4) {
  log("usage: node ./index.js <host>|<host>[|<additional_hosts>] <port>|<port>[|<additional_ports>]");
  process.exit(1);
}

const hosts = process.argv[2].split('|');
const portStrings = process.argv[3].split('|');
// Validate ports
portStrings.forEach(s => {
    const p = Number.parseInt(s);
    if (Number.isNaN(p)) {
    log(`Invalid port ${s}. Ports should all be numbers.`);
    process.exit(1);
    }
    });
const ports = portStrings.map(x => Number.parseInt(x));

const dnsLookups = [];

for (const host of hosts) {
  let lookup = {};
  dnsLookups.push(lookup);
  // DNS lookup

  let startDns4, startDns6;
  let endDns4, endDns6;
  let records4, records6;

  try {
    startDns6 = performance.now();
    records6 = await dns.resolve6(host);
    endDns6 = performance.now();
  } catch (e) {
    // no ipv6 records
  }

  try {
    startDns4 = performance.now();
    records4 = await dns.resolve4(host);
    endDns4 = performance.now();
  } catch (e) {
    // No ipv4 records    
  }

  if (!records4 && !records6) {
    lookup['status'] = STATUS_DOWN;
    lookup['reason'] = `DNS lookup error. No records for ${host}`;
    continue;
  }

  let address;
  let dnsDelay;

  if (records4) {
    address = records4[0];
    dnsDelay = endDns4 - startDns4;
  } else {
    address = records6[0];
    dnsDelay = endDns6 - startDns6;
  }

  lookup['dns-delay-ms'] = dnsDelay;
  lookup['host'] = host;
  lookup['address'] = address;


  for (const port of ports) {
    statuses.push({
port: port,
...lookup
});
}
}

let sockets = [];

for (let status of statuses) {

  if (status.status === STATUS_DOWN) {
    continue;
  }

  // TCP Connection
  const connectionOptions = {
    'port': status.port,
    'host': status.address,
  };

  const connectStart = performance.now();

  let s = new net.Socket()
    .setTimeout(5 * 1000)
    .connect(connectionOptions);

  s.on('connect', () => {
      const connectEnd = performance.now();
      status['connection-delay-ms'] = connectEnd - connectStart;
      status["status"] = STATUS_UP;
      s.end();
      });

  s.on('timeout', () => {
      status.status = STATUS_DOWN;
      status.reason = 'Timeout';
      // THere is nothing at the other end, so destroy immediately
      s.destroy();
      });

  s.on('error', (e) => {
      status.status = STATUS_DOWN;
      status.reason = e;
      // `close` event will be sent right after this;
      });

  s.on('close', () => {
      s.destroy();
      });

  s.on('end', () => {
      s.destroy();
      });

  sockets.push(s);
}


const fun = () => {
  if (sockets.every(x => x.destroyed)) {
    log(statuses);
  } else {
    setTimeout(fun, 500);
  }
};

setTimeout(fun, 500);
