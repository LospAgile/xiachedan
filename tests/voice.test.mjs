import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { send, startLocal } from './helpers.mjs';

const OGG = Buffer.concat([Buffer.from('OggS'), Buffer.alloc(60, 1)]);
const M4A = Buffer.concat([Buffer.from([0, 0, 0, 32]), Buffer.from('ftypM4A '), Buffer.alloc(52, 0)]);
const cookie = member => [...member.jar].map(([key, value]) => `${key}=${value}`).join('; ');
async function voice(space, member, roomId, bytes, duration) {
  const form = new FormData();
  form.append('file', new Blob([bytes]), 'voice');
  const response = await fetch(`${space.base}/api/uploads?${new URLSearchParams({ roomId, voice: '1', duration: String(duration) })}`, { method: 'POST', headers: { 'X-Linliao': '1', cookie: cookie(member) }, body: form });
  return { status: response.status, body: await response.json() };
}

describe('语音消息', () => {
  let space, alice, bob;
  before(async () => {
    space = await startLocal();
    alice = await space.join('Alice');
    bob = await space.join('Bob');
  });
  after(() => space.close());

  test('上传语音后发送，附件带时长，对方能直接播放', async () => {
    const uploaded = await voice(space, alice, 'lobby', OGG, 7);
    assert.equal(uploaded.status, 201);
    assert.equal(uploaded.body.attachment.mime, 'audio/ogg');
    const message = (await send(alice, 'lobby', '', { attachmentIds: [uploaded.body.attachment.id] })).body.message;
    assert.equal(message.attachments[0].duration, 7);
    const media = await fetch(`${space.base}/api/media?id=${uploaded.body.attachment.id}`, { headers: { cookie: cookie(bob) } });
    assert.equal(media.headers.get('content-type'), 'audio/ogg');
    assert.equal(media.headers.get('content-disposition'), null);
  });

  test('Safari 录的 M4A 也认得', async () => {
    assert.equal((await voice(space, alice, 'lobby', M4A, 3)).body.attachment.mime, 'audio/mp4');
  });

  test('时长不对或不是音频会被拒绝', async () => {
    assert.equal((await voice(space, alice, 'lobby', OGG, 0)).status, 400);
    assert.equal((await voice(space, alice, 'lobby', OGG, 301)).status, 400);
    assert.equal((await voice(space, alice, 'lobby', Buffer.from('%PDF-1.7'), 5)).status, 400);
  });
});
