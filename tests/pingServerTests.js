import PingServer from '../pingServer.js';
import CacheServer from '../cacheServer.js';
import { requestAsync } from '../simpleRequest.js';
import { strict as assert } from 'assert';

describe('pingServer', function() {
  this.timeout(0);
  const HOST = 'localhost';
  const PORT = 8080;
  let pingServer;
  let cacheServer;

  beforeEach((done) => {
    cacheServer = new CacheServer({
      host: HOST,
      port: 8081,
      onListening: () => {
        pingServer = new PingServer({
          host: HOST,
          port: PORT,
          onListening: done,
        }, {
          host: HOST,
          port: 8081,
        });
      },
    });
  });

  afterEach((done) => {
    pingServer.stop(() => {
      cacheServer.stop(done);
    });
  });

  it.only('should work', async () => {
    let result = await requestAsync({
      host: HOST,
      port: PORT,
      path: `/ping`,
      method: 'POST',
      body: JSON.stringify({
        'example.com': [ 80, 443 ],
        'example.org': [ 79, 1 ],
      }),
    });

    const data = JSON.parse(result.data.toString());

    assert.equal(data.length, 4);
    console.log(data);
  });
});
