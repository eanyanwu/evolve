import { strict as assert } from 'assert';

export default function InMemoryCache() {
  const cache = {};
  
  this.set = (key, value, ttl) => {
    assert.equal(typeof(key), 'string');
    assert.equal(typeof(value), 'string');
    assert.equal(typeof(ttl), 'number');

    cache[key] = value;

    setTimeout(() => {
      delete cache[key];
    }, ttl);
  };

  this.get = (key) => {
    assert.equal(typeof(key), 'string');
    return cache[key] || '';
  };
}
