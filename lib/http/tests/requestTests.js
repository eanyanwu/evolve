import util from 'util';
import { strict as assert } from 'assert';
import request, { requestAsync } from '../request.js';

describe('request', () => {
  it('can get an html page', async () => {
    const result = await requestAsync({
      host: 'example.org',
      port: 80,
      path: '/',
    });

    const { statusCode, data } = result;
    assert.equal(statusCode, 200);

    const html = data.toString();
    assert.equal(html.startsWith('<!doctype html>'), true);
  });

  it('handles timeouts', (done) => {
    const req = request(
      {
        host: 'example.org',
        port: 79,
        path: '/',
        timeout: 1,
      },
      (err, res) => {
        assert.notEqual(err, null);
        assert.equal(err.code, 'ETIMEDOUT');
        done();
      }
    );
  });
});
