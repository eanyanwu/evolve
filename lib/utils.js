import http from 'http';

export function log(msg) {
  if (process.env.EV_LOG_DEBUG === '1') {
    console.log(`${process.pid}|${new Date(Date.now()).toISOString()}|%O`, msg);
  }
}

export function error(msg) {
  if (process.env.EV_LOG_ERROR === '1') {
    console.error(
      `${process.pid}|${new Date(Date.now()).toISOString()}|%O`,
      msg
    );
  }
}
