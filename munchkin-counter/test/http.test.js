import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, test } from 'node:test';
import { createApp } from '../src/app.js';
import { ROOT_DIR } from '../src/config.js';
import { createInitialState } from '../src/game/state.js';
import { JsonFileStore } from '../src/store.js';

let server;
let app;
let base;
let dir;

before(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'munchkin-http-'));
  const config = {
    version: 'test', port: 3000, publicHost: '192.168.1.50',
    stateFile: path.join(dir, 'state.json'), publicDir: path.join(ROOT_DIR, 'public'),
  };
  const store = new JsonFileStore(config.stateFile, { debounceMs: 0 });
  app = createApp({ config, state: createInitialState(), store, logger: { error() {} } });
  server = http.createServer(app.handle);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  app.hub.close();
  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(dir, { recursive: true, force: true });
});

const post = (body) => fetch(`${base}/api/actions`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: typeof body === 'string' ? body : JSON.stringify(body),
});

describe('pages and static files', () => {
  test('start page, dashboard, phone page, modules and images are served with the right types', async () => {
    for (const [url, type] of [['/', 'text/html'], ['/table', 'text/html'], ['/join', 'text/html'], ['/js/lobby/main.js', 'text/javascript'], ['/js/table/main.js', 'text/javascript'], ['/css/base.css', 'text/css'], ['/img/logo.svg', 'image/svg']]) {
      const res = await fetch(base + url);
      assert.equal(res.status, 200, url);
      assert.match(res.headers.get('content-type'), new RegExp(type));
    }
  });

  test('cannot read files outside public/', async () => {
    for (const url of ['/js/../../package.json', '/js/%2e%2e/%2e%2e/package.json', '/css/..%2F..%2Fsrc/app.js', '/js/%E0%A4%A']) {
      const res = await fetch(base + url);
      assert.ok([400, 404].includes(res.status), `${url} → ${res.status}`);
    }
  });

  test('unknown paths are 404', async () => {
    assert.equal((await fetch(`${base}/nope`)).status, 404);
  });

  test('QR code and info point phones at /join', async () => {
    const info = await (await fetch(`${base}/api/info`)).json();
    assert.equal(info.joinUrl, 'http://192.168.1.50:3000/join');
    assert.ok(info.emojis.length > 0);
    const qr = await fetch(`${base}/qr.svg`);
    assert.match(await qr.text(), /^<svg/);
  });
});

describe('actions API', () => {
  test('applies an action and returns its result', async () => {
    const res = await post({ type: 'addPlayer', name: 'Ana' });
    assert.equal(res.status, 200);
    const player = await res.json();
    assert.equal(player.name, 'Ana');
    const up = await post({ type: 'changeLevel', playerId: player.id, delta: 1 });
    assert.equal((await up.json()).level, 2);
  });

  test('rejects bad input with a clear error', async () => {
    for (const [body, status] of [['{ nope', 400], [{ type: 'winTheGame' }, 400], [{ type: 'die', playerId: 'ghost' }, 404]]) {
      const res = await post(body);
      assert.equal(res.status, status);
      assert.ok((await res.json()).error);
    }
  });

  test('only POST is allowed', async () => {
    assert.equal((await fetch(`${base}/api/actions`)).status, 405);
  });
});

describe('live updates', () => {
  test('a new connection immediately receives the current view', async () => {
    const controller = new AbortController();
    const res = await fetch(`${base}/api/events`, { signal: controller.signal });
    assert.match(res.headers.get('content-type'), /text\/event-stream/);
    const reader = res.body.getReader();
    const { value } = await reader.read();
    controller.abort();
    const view = JSON.parse(new TextDecoder().decode(value).replace(/^data: /, ''));
    assert.equal(view.version, 'test');
    assert.ok(Array.isArray(view.players));
  });
});

describe('logo', () => {
  const serve = async (logoFile) => {
    const config = { version: 'test', port: 3000, publicHost: null, logoFile,
      stateFile: path.join(dir, 'logo-state.json'), publicDir: path.join(ROOT_DIR, 'public') };
    const logoApp = createApp({ config, state: createInitialState(), store: new JsonFileStore(config.stateFile) });
    const logoServer = http.createServer(logoApp.handle);
    await new Promise((resolve) => logoServer.listen(0, '127.0.0.1', resolve));
    const res = await fetch(`http://127.0.0.1:${logoServer.address().port}/logo`);
    const body = Buffer.from(await res.arrayBuffer());
    logoApp.hub.close();
    await new Promise((resolve) => logoServer.close(resolve));
    return { type: res.headers.get('content-type'), body };
  };

  test('is the built-in die logo by default', async () => {
    const { type, body } = await serve(null);
    assert.equal(type, 'image/svg+xml');
    assert.match(body.toString(), /<svg/);
  });

  test('is your own image when LOGO_FILE points to one', async () => {
    const file = path.join(dir, 'logo.png');
    fs.writeFileSync(file, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    const { type, body } = await serve(file);
    assert.equal(type, 'image/png');
    assert.deepEqual([...body], [0x89, 0x50, 0x4e, 0x47]);
  });

  test('falls back to the built-in logo when the file is missing', async () => {
    const { type } = await serve(path.join(dir, 'missing.png'));
    assert.equal(type, 'image/svg+xml');
  });
});
