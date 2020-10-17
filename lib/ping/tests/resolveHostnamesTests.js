import resolveHostnames from '../resolveHostnames.js';
import { strict as assert } from 'assert';

describe('resolveHostnames', () => {
  it('does nothing when given an empty array of hostnames', async () => {
    let results = await resolveHostnames([]);
    assert.equal(results.length, 0);
  });

  it('correctly resolves a list of valid hostnames', async () => {
    let results = await resolveHostnames([
      'example.com',
      'example.net',
      'example.org',
    ]);

    assert.equal(results.length, 3);

    for (const result of results) {
      assert.equal(typeof result, 'object');
      assert.equal(result.hasOwnProperty('hostname'), true);
      assert.equal(result.hasOwnProperty('address'), true);
      assert.equal(result.hasOwnProperty('dnsDelay'), true);
    }
  });

  it('correctly handles a list with invalid hostnames', async () => {
    let results = await resolveHostnames(['example.invalid', 'example.com']);

    assert.equal(results[0].hasOwnProperty('dnsError'), true);
    assert.equal(results[0].hasOwnProperty('dnsDelay'), false);
    assert.equal(results[1].hasOwnProperty('dnsDelay'), true);
    assert.equal(results[1].hasOwnProperty('dnsError'), false);
  });
});
