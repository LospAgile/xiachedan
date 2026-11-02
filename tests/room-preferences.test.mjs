import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { listen, settle, startCloud, startLocal } from './helpers.mjs';

const preference = async (member, roomId) => (await member.get('/api/state')).body.rooms.find(room => room.id === roomId);

describe('会话置顶与免打扰', () => {
  let space, alice, bob, carol, direct;
  before(async () => {
    space = await startLocal();
    alice = await space.join('Alice');
    bob = await space.join('Bob');
    carol = await space.join('Carol');
    direct = (await alice.post('/api/rooms', { userId: bob.id })).body.id;
  });
  after(() => space.close());

  test('默认未置顶、未免打扰', async () => {
    const lobby = await preference(alice, 'lobby');
    assert.equal(lobby.pinnedAt, null);
    assert.equal(lobby.muted, false);
  });

  test('置顶记录时间，重复置顶保留原时间，取消后清空', async () => {
    const first = await alice.post('/api/room-preferences', { roomId: 'lobby', pinned: true });
    assert.equal(first.status, 200);
    assert.ok(first.body.pinnedAt > 0);
    await settle(5);
    const again = await alice.post('/api/room-preferences', { roomId: 'lobby', pinned: true });
    assert.equal(again.body.pinnedAt, first.body.pinnedAt);
    assert.equal((await preference(alice, 'lobby')).pinnedAt, first.body.pinnedAt);
    await alice.post('/api/room-preferences', { roomId: 'lobby', pinned: false });
    assert.equal((await preference(alice, 'lobby')).pinnedAt, null);
  });

  test('置顶与免打扰互不影响', async () => {
    await alice.post('/api/room-preferences', { roomId: direct, pinned: true });
    await alice.post('/api/room-preferences', { roomId: direct, muted: true });
    let room = await preference(alice, direct);
    assert.ok(room.pinnedAt);
    assert.equal(room.muted, true);
    await alice.post('/api/room-preferences', { roomId: direct, pinned: false });
    room = await preference(alice, direct);
    assert.equal(room.pinnedAt, null);
    assert.equal(room.muted, true);
  });

  test('只影响自己，不影响会话里的其他人', async () => {
    await alice.post('/api/room-preferences', { roomId: 'lobby', muted: true });
    assert.equal((await preference(bob, 'lobby')).muted, false);
  });

  test('不能设置无权访问的会话，参数无效被拒绝', async () => {
    assert.equal((await carol.post('/api/room-preferences', { roomId: direct, pinned: true })).status, 403);
    assert.equal((await alice.post('/api/room-preferences', { roomId: 'lobby' })).status, 400);
    assert.equal((await alice.post('/api/room-preferences', { roomId: 'lobby', muted: 'yes' })).status, 400);
  });

  test('只通知自己的其他设备刷新', async () => {
    const mine = await listen(space.base, alice);
    const others = await listen(space.base, bob);
    await settle();
    mine.clear(); others.clear();
    await alice.post('/api/room-preferences', { roomId: 'lobby', pinned: true });
    await settle();
    assert.ok(mine.received('rooms'));
    assert.ok(!others.received('rooms'));
    mine.close(); others.close();
  });
});

describe('账号模式下的会话设置', () => {
  let space;
  before(async () => { space = await startCloud(); });
  after(() => space.close());

  test('审核通过的成员可以置顶和免打扰', async () => {
    const member = await space.member('成员');
    assert.equal((await member.post('/api/room-preferences', { roomId: 'lobby', pinned: true, muted: true })).status, 200);
    const lobby = await preference(member, 'lobby');
    assert.ok(lobby.pinnedAt);
    assert.equal(lobby.muted, true);
  });

  test('待审核的账号不能修改会话设置', async () => {
    const pending = await space.register('待审核');
    assert.equal((await pending.post('/api/room-preferences', { roomId: 'lobby', muted: true })).status, 401);
  });
});
