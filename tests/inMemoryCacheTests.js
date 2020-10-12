import { strict as assert } from 'assert';
import InMemoryCache from '../inMemoryCache.js';

describe('inMemoryCache', () => {
  it('validates inputs', () => {
    const cache = new InMemoryCache();
    assert.throws(() => cache.get());
    assert.throws(() => cache.set());
    assert.throws(() => cache.set('a'));
    assert.throws(() => cache.set('a', 'b'));
  });

  it('sets and gets', () => {
    const cache = new InMemoryCache();

    cache.set('what', 'hath God wrought', 1000);

    const result = cache.get('what');

    assert.equal(result, 'hath God wrought');
  });

  it('expires keys', (done) => {
    const cache = new InMemoryCache();
    cache.set('ghostly', 'cache', 100);

    setTimeout(() => {
      const result = cache.get('ghostly');
      assert.equal(result, '');
      done();
    }, 101);
  });

  it('handles keys that do not exist', () => {
    const cache = new InMemoryCache();
    assert.equal(cache.get('hi'), '');
  });
});