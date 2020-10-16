import http from 'http';
import util from 'util';

export default function request(requestArgs, cb) {
  const req = http.request(requestArgs);

  if (requestArgs.body) {
    req.write(requestArgs.body, 'utf8');
  }

  req.on('timeout', () => {
    const err = new Error('Socket timed out');
    err.code = 'ETIMEDOUT';
    req.destroy(err);
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

  req.on('close', () => {
    console.log(`Request done ${requestArgs.path}`);
  });

  return req.end();
};

export const requestAsync = util.promisify(request);
