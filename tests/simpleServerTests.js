import { strict as assert } from 'assert';
import http from 'http';
import net from 'net';
import serv from '../simpleServer.js';

describe.only('The simple server', () => {
  const HOST = '127.0.0.1';
  const PORT = 8081;

  let s;

  beforeEach(() => {
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
      assert.ok(data.includes('400 Bad Request'), 'unexpeced server response');
      socket.destroy();
      done();
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
});
