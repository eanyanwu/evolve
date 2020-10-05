import net from 'net';
import { performance } from 'perf_hooks';

export default function pingAddresses(connectionOptions, timeout) {
  const sockets = [];
  const connectionResults = [];

  for (const connectionOption of connectionOptions) {
    const start = performance.now();
    const socket = new net.Socket().setTimeout(timeout);

    // Possible outcomes of initiating a socket connection
    socket.on('connect', () => {
      const end = performance.now();
      connectionResults.push({
        ...connectionOption,
        connectionDelay: end - start,
      });
      // Clean up 
      socket.end();
    });

    socket.on('timeout', () => {
      connectionResults.push({
        ...connectionOption,
        connectionError: 'Timeout',
      });
      // Clean up
      // A socket that timed out will probably not respond to `socket.end()`, so we just destroy()
      socket.destroy();
    });
    
    socket.on('error', (err) => {
      connectionResults.push({
        ...connectionOption,
        connectionError: err
      });
      // No need or further action. The 'close' event is automatically sent
    });

    sockets.push(socket);
    
    // Actually initiate the connection
    socket.connect({
      port: connectionOption.port,
      host: connectionOption.address,
      family: 4,
    });
  }

  const poll = (resolve) => {
    if (sockets.every(s => s.destroyed)) {
      resolve(connectionResults);
    } else {
      setTimeout(() => poll(resolve), 500);
    }
  };
  
  return new Promise((resolve, reject) => {
    poll(resolve);
  });
}
