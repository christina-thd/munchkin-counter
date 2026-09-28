import os from 'node:os';

/**
 * Best guess at this machine's address on the home network, for the QR code.
 * Prefers typical home ranges (192.168.x.x, then 10.x.x.x) over Docker and VPN adapters.
 */
export function lanAddress(interfaces = os.networkInterfaces()) {
  const addresses = Object.values(interfaces)
    .flat()
    .filter((i) => i && i.family === 'IPv4' && !i.internal)
    .map((i) => i.address);

  return addresses.find((a) => a.startsWith('192.168.'))
    ?? addresses.find((a) => a.startsWith('10.'))
    ?? addresses[0]
    ?? 'localhost';
}
