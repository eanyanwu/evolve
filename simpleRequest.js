import http from 'http';
import util from 'util';

export default function request(requestArgs, cb) {
  const req = http.request(requestArgs);

  if (requestArgs.body) {
    req.setHeader('Transfer-Encoding', 'chunked');
    req.write(requestArgs.body, 'utf8');
  }

  req.on('timeout', () => {
    const err = new Error('Socket timed out');
    err.code = 'ETIMEDOUT';
    req.destroy(err);
  });

  req.on('abort', () => {
    console.log("WHY ABORT");
  });

  req.on('error', (err) => {
    console.log(err);
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
};

export const requestAsync = util.promisify(request);
