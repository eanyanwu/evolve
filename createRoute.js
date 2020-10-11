import { strict as assert } from 'assert';
import { log, error } from './utils.js';

export function createRoute(method, path, handler) {
  assert.equal(typeof(method), 'string');
  assert.ok(method);
  assert.equal(typeof(path), 'string');
  assert.ok(path);
  assert.equal(typeof(handler), 'function');

  return [ `${method}:${path}`, handler ];
};

export function createRequestHandler(routes) {
  assert.ok(Array.isArray(routes));
  routes.forEach((a) => assert.ok(Array.isArray(a)));

  const routesObj = Object.fromEntries(routes);

  return function (request, response) {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const method = request.method;
    const queryParams = request.searchParams;

    let body = [];
    request.on('data', (chunk) => {
      body.push(chunk):
    });

    request.on('end', () => {
      body = Buffer.concat(body);
      const propName = `${method}:${url.pathname}`;
      if (routesObj.hasOwnProperty(propName)) {
        routesObj[propName]({ queryParams, body, response });
      } else {
        response.statusCode = 404;
        response.statusMessage = http.STATUS_CODES[response.statusCode];
        response.end();
      }
    });

    request.on('error', (err) => {
      error('Request error');
      error(err);
      response.statusCode = 400;
      response.statusMessage = http.STATUS_CODES[response.statusCode];
      response.end();
    });

    response.on('abort', () => {
      log('Response was aborted??');
    });
  };
};
