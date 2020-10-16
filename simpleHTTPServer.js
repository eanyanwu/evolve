import http from 'http';
import { strict as assert } from 'assert';
import { log, error } from './utils.js';
import { performance } from 'perf_hooks';

function createSimpleHTTPServer({ name, onListening }, requestHandler) {
  const server = http.createServer();
  server.closed = false;

  server.on('listening', () => {
    const { address, port } = server.address();
    log(`${(name || 'Process')} is listening on ${address}:${port}.`);
  });

  if (onListening) {
    server.once('listening', onListening);
  }

 server.on('error', (err) => {
   error(err);
   error(`Unexpected error occured. Closing...`);
   server.close();
 });

  server.on('clientError', (err, socket) => {
    if (err.code === 'ECONNRESET' || !socket.writable) {
      return;
    }
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
  });

  server.on('close', () => {
    server.closed = true;
    log(`${(name || 'Process')} is now deaf.`);
  });

  server.on('request', function attachErrorHandlers(req, res) {
    req.on('aborted', () => {
      log('Request aborted. Do i need to do anything?');
    });

    req.on('error', (err) => {
      error('Request error');
      error(err);
      res.statusCode = 400;
      res.end();
    });

    res.on('error', (err) => {
      error('Response error');
      error(err);
      res.statusCode = 500;
      res.end();
    });
  });

  server.on('request', function extractBody(req, res) {
    let body = [];

    req.on('data', (chunk) => {
      body.push(chunk);
    });
    
    req.on('end', () => {
      body = Buffer.concat(body);
      const headers = req.headers;
      const method = req.method;
      const { pathname, searchParams } = new URL(req.url, `http://${req.headers.host}`);

      setTimeout(async () => {
        let args = { method, body, path: pathname, searchParams, headers, res };
        if (pathname.startsWith(SERVER_METRICS_PATH)) {
          metricsHandler(args);
        } else {
          await requestHandler(args);
        }
      });
    });
  });

  return server;
}

function metricsHandler({ method, path, res }) {
  if (path === `${SERVER_METRICS_PATH}/elu`) {
    const elu = performance.eventLoopUtilization();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.write(JSON.stringify(elu));
    res.end();
  }
  else {
    res.writeHead(404);
    res.end();
  }
}

export default function SimpleHTTPServer(options, requestHandler = () => {}) {
    assert.equal(typeof(options), 'object');
    assert.notEqual(options, null);
    assert.equal(typeof(requestHandler), 'function');

    const server = createSimpleHTTPServer(options, requestHandler);

    server.listen(options);

    this.stop = (callback) => {
      server.close(callback);
    };

    this.isListening = () => {
      return server.listening;
    };

    this.isClosed = () => {
      return server.closed;
    };

    this.getAddress = () => {
      return server.address();
    };
}

export const SERVER_METRICS_PATH = '/_server_metrics';
