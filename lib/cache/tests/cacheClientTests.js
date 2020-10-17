import CacheClient from '../CacheClient.js';
import CacheServer from '../CacheServer.js';
import { strict as assert } from 'assert';

describe('cacheClient', () => {
  let s;
  let HOST = 'localhost';
  let PORT = 8080;

  beforeEach((done) => {
    s = new CacheServer({
      host: HOST,
      port: PORT,
      onListening: done,
    });
  });

  afterEach((done) => {
    s.stop(done);
  });

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  it('sets and gets', async () => {
    const client = new CacheClient({ host: HOST, port: PORT });
    await client.set('hello', 'cache', 1000);
    let result = await client.get('hello');
    assert.equal(result, 'cache');
  });

  it('handles ttls', async () => {
    const client = new CacheClient({ host: HOST, port: PORT });
    await client.set('goodbye', 'cache', 100);
    await delay(101);
    let result = await client.get('goodbye');
    assert.equal(result, '');
  });
});
