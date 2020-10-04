import { promises as dns } from 'dns';
import { performance } from 'perf_hooks';

export default function resolveHostnames(hostnames) {
  const promises = [];

  for (const hostname of hostnames) {
    let start = performance.now();
    let promise = dns.resolve4(hostname)
      .then((addresses) => {
        let end = performance.now();
        return {
          hostname,
          address: addresses[0],
          dnsDelay: end - start,
        };
      })
      .catch((error) => {
        return {
          hostname,
          dnsError: error,
        };
      });
    promises.push(promise);
  }
  
  return Promise.allSettled(promises)
                .then(results => results.map(p => p.value));
}
