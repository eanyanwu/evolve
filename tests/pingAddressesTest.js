import resolveHostnames from '../resolveHostnames.js';
import pingAddresses from '../pingAddresses.js';
import pkg from 'chai';

const { expect } = pkg;

describe('pingAddresses', () => {
  it('Handles an empty list of connection options', async () => {
    const results = await pingAddresses([]);

    expect(results.length).to.equal(0);
  });

  it('Records the connection delay for succesful connections', async () => {
    // get a valid hostname address
    const hostname = 'example.org';
    const port = 80;
    const address = (await resolveHostnames([hostname]))[0].address;
    const connectionOption = {
      hostname,
      address,
      port,
    };

    const result = await pingAddresses([connectionOption], 10_000);

    expect(result.length).to.equal(1);
    expect(result[0].hostname).to.equal('example.org');
    expect(result[0]).to.have.own.property('connectionDelay');
  });

  it('Records a timeout error for connections to invalid targets', async () => {
    const hostname = 'example.org';
    const port = 1;
    const address = (await resolveHostnames([hostname]))[0].address;
    const connectionOption = {
      hostname,
      address,
      port,
    };

    const result = await pingAddresses([connectionOption], 1_000);

    expect(result.length).to.equal(1);
    expect(result[0].connectionError).to.equal('Timeout');
  });
});
