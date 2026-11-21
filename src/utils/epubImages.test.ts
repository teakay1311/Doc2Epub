import test from 'node:test';
import assert from 'node:assert/strict';
import { createEpubImageReader } from './epubImages';

// Only the JPEG signature and end marker are needed to reach the worker boundary.
const jpeg = 'data:image/jpeg;base64,/9j//9k=';
const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGPgkYwAAACyAH5m6g6iAAAAAElFTkSuQmCC';

function pendingWorker() {
  let notify!: () => void;
  const posted = new Promise<void>(resolve => { notify = resolve; });
  let terminated = 0;
  const worker = {
    onmessage: null as ((event: MessageEvent) => void) | null,
    onerror: null,
    onmessageerror: null,
    postMessage: () => notify(),
    terminate: () => { terminated++; }
  };
  return { worker, posted, open: async () => worker as unknown as Worker, terminations: () => terminated };
}

test('JPEG timeout or cancellation terminates the running worker and aborts the read', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  for (const cancel of [true, false]) {
    const task = pendingWorker();
    const controller = new AbortController();
    const reader = createEpubImageReader(controller.signal, task.open);
    const reading = reader.read(jpeg);
    await task.posted;
    const rejection = assert.rejects(reading, cancel ? { name: 'AbortError' } : { message: 'JPEG_CHECK_TIMEOUT' });
    if (cancel) controller.abort();
    else t.mock.timers.tick(30_000);
    await rejection;
    reader.dispose();
    assert.equal(task.terminations(), 1);
    assert.equal(task.worker.onmessage, null);
  }
});

test('JPEG worker startup failure and resource limits differ from a corrupt image', async () => {
  const failed = createEpubImageReader(undefined, async () => { throw new Error('Worker unavailable'); });
  await assert.rejects(failed.read(jpeg), { message: 'JPEG_CHECK_FAILED' });

  const task = pendingWorker();
  const reader = createEpubImageReader(undefined, task.open);
  const malformed = reader.read(jpeg);
  await task.posted;
  task.worker.onmessage!(new MessageEvent('message', { data: 'invalid' }));
  assert.equal(await malformed, null);
  assert.equal(task.terminations(), 0);
  const limited = reader.read(jpeg);
  task.worker.onmessage!(new MessageEvent('message', { data: 'limit' }));
  await assert.rejects(limited, { message: 'JPEG_CHECK_LIMIT' });
  assert.equal(task.terminations(), 1);
});

test('PNG validation shares the worker lifecycle and reports operational failures', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const task = pendingWorker();
  const reader = createEpubImageReader(undefined, task.open);
  const reading = reader.read(png);
  await task.posted;
  const rejection = assert.rejects(reading, { message: 'PNG_CHECK_TIMEOUT' });
  t.mock.timers.tick(30_000);
  await rejection;
  assert.equal(task.terminations(), 1);

  const unavailable = createEpubImageReader(undefined, async () => { throw Error('worker down'); });
  await assert.rejects(unavailable.read(png), { message: 'PNG_CHECK_FAILED' });
});
