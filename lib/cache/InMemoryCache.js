import { strict as assert } from 'assert';

/* Add timeouts to a dict and call it a "cache" */
export default function InMemoryCache() {
  const cache = {};

  this.set = (key, value, ttl = 0) => {
    assert.equal(typeof key, 'string');
    assert.equal(typeof value, 'string');
    assert.equal(typeof ttl, 'number');

    cache[key] = value;

    if (ttl > 0) {
      console.log('Clearing cache');
      setTimeout(() => {
        delete cache[key];
      }, ttl);
    }
  };

  this.get = (key) => {
    assert.equal(typeof key, 'string');
    return cache[key] || '';
  };
}
