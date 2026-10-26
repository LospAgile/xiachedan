import { networkInterfaces } from 'node:os';

// 按网卡类型筛选，保留使用 10.x 地址的真实 Wi-Fi / 以太网。
const virtualInterface = /^(feth|utun|tun|tap|ipsec|ppp|gif|stf|awdl|llw|vmnet|vboxnet|docker|veth|br-|tailscale|zt|wg)/i;
const physicalInterface = /^(en\d+$|eth\d+$|enp|eno|ens|wl|Wi-Fi|Ethernet)/i;

export function lanAddresses(port, interfaces = networkInterfaces()) {
  const candidates = Object.entries(interfaces).flatMap(([name, entries]) => {
    if (virtualInterface.test(name)) return [];
    return (entries || []).filter(entry => entry.family === 'IPv4' && !entry.internal &&
      /^(10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(entry.address))
      .map(entry => ({ name, address: entry.address, priority: physicalInterface.test(name) ? 0 : 1 }));
  });
  candidates.sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name, 'en', { numeric: true }));
  return [...new Set(candidates.map(entry => `http://${entry.address}:${port}`))];
}
