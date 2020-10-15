import CacheClient from '../cacheClient.js';
import CacheServer from '../cacheServer.js';
import { strict as assert } from 'assert';

describe('cacheClient', () => {
  let s;
  let HOST = 'localhost';
  let PORT = 8080;

  beforeEach(() => {
    s = new CacheServer(PORT);
  });
  
  afterEach(() => {
    s.stop();
  });

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  it('sets and gets', async () => {
    const client = new CacheClient(HOST, PORT);
    await client.set('hello', 'cache', 1000);
    let result = await client.get('hello');
    assert.equal(result, 'cache');
  });

  it('handles ttls', async () => {
    const client = new CacheClient(HOST, PORT);
    await client.set('goodbye', 'cache', 100);
    await delay(101);
    let result = await client.get('goodbye');
    assert.equal(result, '');
  });
});
