import http from 'http';

export function log(msg) {
  console.log(`${new Date(Date.now()).toISOString()}|%O`, msg);
}

export function error(msg) {
  console.error(`${new Date(Date.now()).toISOString()}|%O`, msg);
}


export function closeConnection(response, statusCode) {
  response.statusCode = statusCode;
  response.statusMessage = http.STATUS_CODES[response.statusCode];
  response.end();
}
