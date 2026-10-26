import { useCallback, useEffect, useRef } from 'react';
import { api } from './api';

export default function useMessageReads(userId, connected, applyReceipt) {
  const queue = useRef(new Map());
  const schedule = useRef(null);
  useEffect(() => { queue.current.clear(); }, [userId]);
  useEffect(() => {
    if (!userId || !connected) return;
    let stopped = false, timer, inFlight = false, controller, retryDelay = 1000;
    function plan(delay = 150) {
      if (stopped || timer || inFlight || !queue.current.size) return;
      timer = setTimeout(flush, delay);
    }
    async function flush() {
      timer = null;
      const entry = queue.current.entries().next().value;
      if (stopped || !entry) return;
      const [roomId, ids] = entry;
      const messageIds = [...ids].slice(0, 100);
      inFlight = true;
      controller = new AbortController();
      let delay = 150;
      try {
        const receipt = await api('message-reads', { roomId, messageIds }, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]) });
        if (stopped) return;
        applyReceipt(receipt);
        for (const id of messageIds) ids.delete(id);
        retryDelay = 1000;
      } catch (error) {
        if (stopped) return;
        if ([400, 403, 404].includes(error.status)) for (const id of messageIds) ids.delete(id);
        else { delay = retryDelay; retryDelay = Math.min(retryDelay * 2, 30000); }
      } finally {
        inFlight = false;
        if (!ids.size && queue.current.get(roomId) === ids) queue.current.delete(roomId);
        plan(delay);
      }
    }
    schedule.current = plan;
    plan();
    return () => { stopped = true; clearTimeout(timer); controller?.abort(); schedule.current = null; };
  }, [userId, connected, applyReceipt]);
  return useCallback((roomId, messageId) => {
    if (!queue.current.has(roomId)) queue.current.set(roomId, new Set());
    queue.current.get(roomId).add(messageId);
    schedule.current?.();
  }, []);
}
