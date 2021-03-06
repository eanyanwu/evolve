import PingServer from '../PingServer.js';
import CacheServer from '../../cache/CacheServer.js';
import { requestAsync } from '../../http/request.js';
import { strict as assert } from 'assert';

describe('PingServer', function () {
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
        pingServer = new PingServer(
          {
            host: HOST,
            port: PORT,
            onListening: done,
          },
          {
            host: HOST,
            port: 8081,
          }
        );
      },
    });
  });

  afterEach((done) => {
    pingServer.stop(() => {
      cacheServer.stop(done);
    });
  });

  it('pings valid hostname and port', async () => {
    let result = await requestAsync({
      host: HOST,
      port: PORT,
      path: '/ping',
      method: 'GET',
      body: JSON.stringify({
        'example.org': [80, 443],
      }),
    });

    const { statusCode, data } = result;

    assert.equal(statusCode, 200);

    const json = JSON.parse(data.toString());

    assert.equal(json.length, 2);

    assert.equal(
      json.every((x) => x.hostname === 'example.org'),
      true
    );
    assert.equal(
      json.every((x) => x.hasOwnProperty('dnsDelay')),
      true
    );
    assert.equal(
      json.every((x) => x.hasOwnProperty('connectionDelay')),
      true
    );
  });

  it('times out when pinging non-responsive port', async () => {
    let result = await requestAsync({
      host: HOST,
      port: PORT,
      path: '/ping',
      method: 'GET',
      body: JSON.stringify({
        'example.org': [9],
      }),
    });

    const { statusCode, data } = result;

    assert.equal(statusCode, 200);

    const json = JSON.parse(data.toString());

    assert.equal(json.length, 1);

    assert.equal(json[0].hostname, 'example.org');
    assert.equal(json[0].port, 9);
    assert.equal(json[0].connectionError, 'Timeout');
    assert.equal(json[0].hasOwnProperty('dnsDelay'), true);
  });

  it('handles unreachable hostnames', async () => {
    let result = await requestAsync({
      host: HOST,
      port: PORT,
      path: '/ping',
      method: 'GET',
      body: JSON.stringify({
        notaurl: [80],
      }),
    });

    const { statusCode, data } = result;

    assert.equal(statusCode, 200);

    const json = JSON.parse(data.toString());

    assert.equal(json.length, 1);
    assert.equal(json[0].hostname, 'notaurl');
    assert.equal(json[0].hasOwnProperty('port'), false);
    assert.equal(json[0].hasOwnProperty('dnsError'), true);
  });

  it('handles multiple endpoints', async () => {
    let result = await requestAsync({
      host: HOST,
      port: PORT,
      path: `/ping`,
      method: 'POST',
      body: JSON.stringify({
        'example.com': [80, 443],
        'example.org': [79, 1],
        notaurl: [80],
      }),
    });

    const data = JSON.parse(result.data.toString());

    assert.equal(data.length, 5);
    let exampleCom = data.filter((d) => d.hostname === 'example.com');
    let exampleOrg = data.filter((d) => d.hostname === 'example.org');
    let notaurl = data.filter((d) => d.hostname === 'notaurl');

    assert.equal(exampleCom.length, 2);
    assert.equal(exampleOrg.length, 2);
    assert.equal(notaurl.length, 1);
  });

  it('uses the cache on subsequent attempts', async () => {
    const requestOptions = {
      host: HOST,
      port: PORT,
      path: '/ping',
      method: 'POST',
      body: JSON.stringify({
        'example.org': [443]
      }),
    };

    const result = await requestAsync(requestOptions);
    assert.equal(result.statusCode, 200);

    const result2 = await requestAsync(requestOptions);
    assert.equal(result2.statusCode, 200);

    const json = JSON.parse(result.data.toString())[0];
    const json2 = JSON.parse(result2.data.toString())[0];

    assert.equal(json.dnsDelay, json2.dnsDelay);
    assert.equal(json.connectionDelay, json2.connectionDelay);
  });

  it('does not use the cache if skipCache is true', async () => {
    const requestOptions = {
      host: HOST,
      port: PORT,
      path: '/ping',
      method: 'POST',
      body: JSON.stringify({
        'example.org': [443]
      }),
    };

    const result = await requestAsync(requestOptions);
    assert.equal(result.statusCode, 200);

    requestOptions.path = '/ping?skipCache=true';
    const result2 = await requestAsync(requestOptions);
    assert.equal(result2.statusCode, 200);

    const json = JSON.parse(result.data.toString())[0];
    const json2 = JSON.parse(result2.data.toString())[0];

    assert.notEqual(json.dnsDelay, json2.dnsDelay);
    assert.notEqual(json.connectionDelay, json2.connectionDelay);
  });
  

  it('does not return a cached value if ttl has past', async () => {
    const requestOptions = {
      host: HOST,
      port: PORT,
      method: 'POST',
      path: '/ping?cacheTTL=100',
      body: JSON.stringify({
        'example.org': [ 80 ],
      }),
    };

    const result = await requestAsync(requestOptions);
    
    assert.equal(result.statusCode, 200);

    const json = JSON.parse(result.data.toString())[0];

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    await delay(200);

    const result2 = await requestAsync(requestOptions);

    assert.equal(result2.statusCode, 200);

    const json2 = JSON.parse(result2.data.toString())[0];

    assert.notEqual(json.dnsDelay, json2.dnsDelay);
    assert.notEqual(json.connectionDelay, json2.connectionDelay);
  });
});
