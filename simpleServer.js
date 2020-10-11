import http from 'http';
import { strict as assert } from 'assert';
import { log, error } from './utils.js';

function createSimpleHTTPServer(listenOptions) {
  const server = http.createServer();

  server.on('listening', () => {
    const { address, port } = server.address();
    log(`Process is listening on ${address}:${port}.`);
  });

  server.on('request', (req, res) => {
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      log('Address in use, retrying...');
      setTimeout(() => {
        server.close();
        server.listen(listenOptions);
      }, 5000);
    } else {
      error(err);
      error(`Unexpected error occured. Closing...`);
      server.close();
    }
  });

  server.on('clientError', (err, socket) => {
    if (err.code === 'ECONNRESET' || !socket.writable) {
      return;
    }
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
  });

  server.on('close', () => {
    log('Server closing');
  });

  return server;
}

export default {
  startNew: (options, requestHandler) => {
    if (requestHandler) {
      assert.ok(typeof(requestHandler) === 'function');
    }
    assert.ok(typeof(options) === 'object');
    assert.ok(options != null);

    const server = createSimpleHTTPServer(options);
    server.on('request', requestHandler);
    
    server.listen(options);

    return {
      stop: (callback) => {
        server.close(callback);
      },
      listening: () => server.listening,
    };
  },
};
