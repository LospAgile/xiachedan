export function validateAddress(value) {
  if (typeof value !== 'string' || value.length > 200) throw new Error('请输入有效的内网地址');
  let url;
  try { url = new URL(value.includes('://') ? value : `http://${value}`); }
  catch { throw new Error('地址格式不正确，例如 http://192.168.1.8:4318'); }
  const host = url.hostname;
  const privateAddress = host === 'localhost' || host === '[::1]' ||
    /^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host) && /^\d+\.\d+\.\d+\.\d+$/.test(host);
  if (url.protocol !== 'http:' || !privateAddress || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('请使用局域网 IP 地址，例如 http://192.168.1.8:4318');
  }
  return url.origin;
}

export function parseInvitation(value) {
  if (typeof value !== 'string' || !value.trim()) throw new Error('请粘贴同事发来的邀请信息');
  if (value.length > 4096) throw new Error('邀请信息过长，请重新复制');
  const text = value.trim().split(/\r?\n/).filter(line => !line.startsWith('邀请你加入「')).join('\n');
  const codeMatch = text.match(/(?:空间)?邀请码\s*[:：]\s*([a-f\d]{12})(?![a-f\d])/i);
  const inviteCode = (codeMatch?.[1] || (/^[a-f\d]{12}$/i.test(text) ? text : '')).toUpperCase();
  const matches = text.match(/https?:\/\/[^\s<>"'，。；）)「」【】]+/gi) || [];
  if (!matches.length && !inviteCode) matches.push(text);
  const addresses = [...new Set(matches.map(validateAddress))];
  if (addresses.length > 8) throw new Error('邀请中的地址过多，请重新复制');
  if (!addresses.length && !inviteCode) throw new Error('没有识别到地址或邀请码，请复制完整邀请');
  return { addresses, inviteCode };
}

export function formatInvitation({ addresses, code, spaceName }) {
  if (!addresses?.length) return '';
  const title = spaceName ? `邀请你加入「${spaceName.replace(/\s+/g, ' ')}」` : '来虾扯蛋一起聊聊';
  return `${title}\n内网地址：${addresses.join('\n')}\n邀请码：${code}\n在虾扯蛋的“加入空间”粘贴整段邀请，即可进入。`;
}
