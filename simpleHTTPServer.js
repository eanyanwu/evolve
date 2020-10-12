import http from 'http';
import { strict as assert } from 'assert';
import { log, error } from './utils.js';

function createSimpleHTTPServer(listenOptions) {
  const server = http.createServer();
  server.closed = false;

  server.on('listening', () => {
    const { address, port } = server.address();
    log(`Process is listening on ${address}:${port}.`);
  });

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
    log('Server closing.');
  });

  return server;
}

export default {
  startNew: (options, requestHandler) => {
    assert.equal(typeof(options), 'object');
    assert.notEqual(options, null);

    const server = createSimpleHTTPServer(options);
    
    if (requestHandler) {
      assert.equal(typeof(requestHandler), 'function');
      server.on('request', requestHandler);
    }

    server.listen(options);

    return {
      stop: (callback) => {
        server.close(callback);
      },
      isListening: () => server.listening,
      isClosed: () => server.closed,
    };
  },
};
