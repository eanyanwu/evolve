import server from '../pingServer.js';
import http from 'http';

describe('pingServer', () => {
  const port = '8081';

  beforeEach(() => {
    server.start(port);
  });

  afterEach(() => {
    server.stop();
  });

  it('returns connection delay information', async () => {
  });
});
