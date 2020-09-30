import { promises as dns } from 'dns';
import { performance } from 'perf_hooks';
import net from 'net';

const log = console.log;
const STATUS_DOWN = "DOWN";
const STATUS_UP = "UP";
const status = {};

if (process.argv.length != 4) {
    log("usage: node ./index.js <host> <port>");
    process.exit(1);
}

const host = process.argv[2];
const port = Number.parseInt(process.argv[3]);

if (Number.isNaN(port)) {
    log("<port> should be a number");
    process.exit(1);
}

log(`Host: ${host}\nPort: ${port}`);

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
    status['status'] = STATUS_DOWN;
    status['reason'] = `DNS lookup error. No records for ${host}`;
    process.exit(1);
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

status['dns-delay-ms'] = dnsDelay;
status['address'] = address;


// TCP Connection
const connectionOptions = {
    'port': port,
    'host': address,
    'timeout': 5 * 1000,
    'family': 0,
};

let s = net.createConnection(connectionOptions, () => {
    status["status"] = STATUS_UP;
    log(status);
    s.end();
});

s.on('timeout', () => {
    status['status'] = STATUS_DOWN;
    status['reason'] = 'Timeout';
    log(status);
    s.destroy();
});

s.on('error', (e) => {
    status['status'] = STATUS_DOWN;
    status['reason'] = e,
    log(status);
    // the socket code calls close() after an 'error' event.
});