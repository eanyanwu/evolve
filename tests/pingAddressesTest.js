import resolveHostnames from '../resolveHostnames.js';
import pingAddresses from '../pingAddresses.js';
import { strict as assert } from 'assert';

describe('pingAddresses', () => {
  it('Handles an empty list of connection options', async () => {
    const results = await pingAddresses([]);

    assert.equal(results.length, 0);
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

    assert.equal(result.length, 1);
    assert.equal(result[0].hostname, 'example.org');
    assert.equal(result[0].hasOwnProperty('connectionDelay'), true);
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

    assert.equal(result.length, 1);
    assert.equal(result[0].connectionError, 'Timeout');
  });
});
