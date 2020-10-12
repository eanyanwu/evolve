import { strict as assert } from 'assert';
import http from 'http';
import net from 'net';
import serv from '../simpleHTTPServer.js';

describe('The simple http server', () => {
  let HOST;
  let PORT;
  let s;

  beforeEach(() => {
    HOST = '127.0.0.1';
    PORT = 8081;
    s = serv.startNew({
      host: HOST,
      port: PORT,
    }, (req, res) => {
      res.end('OK');
    });
  });

  afterEach(() => {
    s.stop();
  });

  it('responds to a valid http request', (done) => {
    let req = http.request({
      host: HOST,
      port: PORT,
      path: '/',
      timeout: 1000,
    });

    req.on('response', (res) => {
      assert.ok(res.statusCode === 200, 'status code was not 200');
      req.destroy();
      done();
    });

    req.on('timeout', () => {
      req.destroy(new Error('Timed out'));
    });

    req.on('error', (err) => {
      done(err);
    });

    req.end();
  });
  
  it('responds to a malformed http request', (done) => {
    let socket = new net.Socket();
    socket.setTimeout(1000);
    socket.setEncoding('utf8');

    socket.on('data', (data) => {
      assert.equal(data.includes('400 Bad Request'), true, 'unexpeced server response');
      setImmediate(() => {
        assert.equal(s.isListening(), true, 'expected server to still be up');
        socket.destroy();
        done();
      });
    });

    socket.on('timeout', () => {
      socket.destroy(new Error('Timed out'));
    });

    socket.on('error', (err) => {
      done(err);
    });

    socket.connect({
      port: PORT,
      host: HOST,
    });

    socket.write('Not HTTP');
  });

  it('handles the error event', (done) => {
    let newServer = serv.startNew({
      host: HOST,
      port: PORT,
    });
    
    assert.equal(newServer.isClosed(), false);

    // If we are not handling node would throw an exception and 
    // this test would fail.
    setImmediate(() => {
      assert.equal(newServer.isClosed(), true);
      done();
    });
  });
});