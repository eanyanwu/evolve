import resolveHostnames from '../resolveHostnames.js';
import pkg from 'chai';

const { expect } = pkg;

describe('resolveHostnames', () => {
  it('does nothing when given an empty array of hostnames', async () => {
    let results = await resolveHostnames([]);
    expect(results.length).to.equal(0);
  });

  it('correctly resolves a list of valid hostnames', async () => {
    let results = await resolveHostnames([
      'example.com',
      'example.net',
      'example.org'
    ]);

    expect(results.length).to.equal(3);
    
    for (const result of results) {
      expect(result).to.be.an('object');
      expect(result).to.have.own.property('hostname');
      expect(result).to.have.own.property('address');
      expect(result).to.have.own.property('dnsDelay');
    }
  });

  it('correctly handles a list with invalid hostnames', async () => {
    let results = await resolveHostnames([
      'example.invalid',
      'example.com',
    ]);

    expect(results[0]).to.have.own.property('dnsError');
    expect(results[0]).to.not.have.own.property('dnsDelay');
    expect(results[1]).to.have.property('dnsDelay');
    expect(results[1]).to.not.have.own.property('dnsError');
  });
});
