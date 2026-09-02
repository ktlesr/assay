import heapq
import time


class Scheduler:
    def __init__(self, clock=time.monotonic):
        self._clock = clock
        self._queue = []
        self._seq = 0

    def schedule(self, delay, fn, *args):
        if delay < 0:
            raise ValueError("delay must not be negative")
        self._seq += 1
        heapq.heappush(self._queue, (self._clock() + delay, self._seq, fn, args))
        return self._seq

    def cancel(self, token):
        before = len(self._queue)
        self._queue = [e for e in self._queue if e[1] != token]
        heapq.heapify(self._queue)
        return len(self._queue) != before

    def run_due(self):
        now = self._clock()
        ran = 0
        while self._queue and self._queue[0][0] <= now:
            _, _, fn, args = heapq.heappop(self._queue)
            fn(*args)
            ran += 1
        return ran

    def next_deadline(self):
        return self._queue[0][0] if self._queue else None
