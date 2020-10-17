import http from 'http';
import util from 'util';

/**
 * Kicks off an HTTP request and returns the request object.
 */
export default function request(
  { host = 'localhost', port = 80, method = 'GET', path = '/', timeout, body },
  cb
) {
  const req = http.request({ host, port, method, path, timeout });

  if (body) {
    req.setHeader('Transfer-Encoding', 'chunked');
    req.write(body, 'utf8');
  }

  req.on('timeout', () => {
    const err = new Error('Socket timed out');
    err.code = 'ETIMEDOUT';
    req.destroy(err);
  });

  req.on('abort', () => {
    console.log('WHY ABORT');
  });

  req.on('error', (err) => {
    cb(err);
  });

  req.on('response', (res) => {
    res.on('error', (err) => {
      cb(err);
    });

    let data = [];
    res.on('data', (chunk) => {
      data.push(chunk);
    });

    res.on('end', () => {
      data = Buffer.concat(data);
      const { statusCode, statusMessage, headers } = res;
      cb(null, {
        statusCode,
        statusMessage,
        headers,
        data,
      });
    });
  });

  return req.end();
}

/**
 * Promisified version of the request() function
 */
export const requestAsync = util.promisify(request);
