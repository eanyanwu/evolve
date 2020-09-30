import net from 'net';

const log = console.log;

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

const connectionOptions = {
    'port': port,
    'host': host,
    'timeout': 5 * 1000,
    'family': 0,
};

let s = net.createConnection(connectionOptions, () => {
    log({
        'status': 'UP'
    });
    s.end();
});

s.on('timeout', () => {
    log({
        'status': 'DOWN',
        'reason': 'Timeout'
    });
    s.destroy();
});

s.on('error', (e) => {
    log({
        'status': 'DOWN',
        'reason': e,
    });
    // the socket code calls close() after an 'error' event.
});