import http from 'http';

export function log(msg) {
  console.log(`${process.pid}|${new Date(Date.now()).toISOString()}|%O`, msg);
}

export function error(msg) {
  console.error(`${process.pid}|${new Date(Date.now()).toISOString()}|%O`, msg);
}


export function closeConnection(response, statusCode) {
  response.statusCode = statusCode;
  response.statusMessage = http.STATUS_CODES[response.statusCode];
  response.end();
}
