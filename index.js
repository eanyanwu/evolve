import { promises as dns } from 'dns';
import { performance } from 'perf_hooks';
import net from 'net';
import { Socket } from 'dgram';

const log = console.log;
const STATUS_DOWN = "DOWN";
const STATUS_UP = "UP";
const statusTemplate = {};

if (process.argv.length < 4) {
    log("usage: node ./index.js <host> <port> [...<additional_ports>]");
    process.exit(1);
}

const host = process.argv[2];
const portStrings = process.argv.slice(3);
// Validate ports
portStrings.forEach(s => {
    const p = Number.parseInt(s);
    if (Number.isNaN(p)) {
        log(`Invalid port ${s}. Ports should all be numbers.`);
        process.exit(1);
    }
});

const ports = portStrings.map(x => Number.parseInt(x));

statusTemplate['host'] = host;

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
    statusTemplate['status'] = STATUS_DOWN;
    statusTemplate['reason'] = `DNS lookup error. No records for ${host}`;
    log(status);
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

statusTemplate['dns-delay-ms'] = dnsDelay;
statusTemplate['address'] = address;


for (let port of ports) {
    let status = Object.assign({}, statusTemplate);
    status['port'] = port;
    
    // TCP Connection
    const connectionOptions = {
        'port': port,
        'host': address,
        'family': 0,
    };
    
    let connectStart = performance.now();
    
    let s = new net.Socket()
                    .setTimeout(5 * 1000)
                    .connect(connectionOptions);
    
    s.on('connect', () => {
        let connectEnd = performance.now();
        status['connection-delay-ms'] = connectEnd - connectStart;
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
}