// Runs public/js/shared/device-check.js against real device user agents and screen sizes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, test } from 'node:test';
import vm from 'node:vm';
import { ROOT_DIR } from '../src/config.js';

const SCRIPT = fs.readFileSync(path.join(ROOT_DIR, 'public/js/shared/device-check.js'), 'utf8');

/** @returns {'phone' | 'dashboard'} where the device ends up */
function check({ ua, width, height, touch = 0, coarse = touch > 0, search = '', stored = {} }) {
  let redirected = false;
  const store = new Map(Object.entries(stored));
  vm.runInNewContext(SCRIPT, {
    navigator: { userAgent: ua, maxTouchPoints: touch },
    screen: { width, height },
    matchMedia: (query) => ({ matches: query === '(pointer: coarse)' && coarse }),
    location: { search, replace: () => { redirected = true; } },
    URLSearchParams,
    localStorage: {
      getItem: (k) => store.get(k) ?? null,
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    },
  });
  return { device: redirected ? 'phone' : 'dashboard', store };
}

const DEVICES = {
  phones: {
    'iPhone': { ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1', width: 393, height: 852, touch: 5 },
    'Android phone': { ua: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36', width: 412, height: 915, touch: 5 },
    'phone in "desktop site" mode': { ua: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36', width: 412, height: 915, touch: 5 },
  },
  dashboard: {
    'iPad (reports as a Mac)': { ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15', width: 820, height: 1180, touch: 5 },
    'Android tablet': { ua: 'Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36', width: 800, height: 1280, touch: 5 },
    'Samsung TV (Tizen), 960×540': { ua: 'Mozilla/5.0 (SMART-TV; LINUX; Tizen 7.0) AppleWebKit/537.36 (KHTML, like Gecko) 94.0.4606.31/7.0 TV Safari/537.36', width: 960, height: 540 },
    'LG TV (webOS), 960×540': { ua: 'Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.128 Safari/537.36 WebAppManager', width: 960, height: 540 },
    'Sony Bravia (Android TV), 960×540': { ua: 'Mozilla/5.0 (Linux; Android 12; BRAVIA 4K VH2 Build/STT1.211025.001) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36', width: 960, height: 540 },
    'Google TV / Chromecast, 960×540': { ua: 'Mozilla/5.0 (Linux; Android 12; Chromecast Build/STTL.240206.002) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36 CrKey/1.56.500000', width: 960, height: 540, coarse: true },
    'Fire TV (Silk), 960×540': { ua: 'Mozilla/5.0 (Linux; Android 9; AFTKA Build/PS7633.3445N) AppleWebKit/537.36 (KHTML, like Gecko) Silk/128.1 like Chrome/128.0 Mobile Safari/537.36', width: 960, height: 540 },
    'unknown TV browser, no touch, 960×540': { ua: 'Mozilla/5.0 (X11; Linux armv7l) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36', width: 960, height: 540 },
    'laptop': { ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36', width: 1536, height: 864 },
  },
};

describe('device check', () => {
  for (const [name, device] of Object.entries(DEVICES.phones)) {
    test(`${name} → phone controls`, () => assert.equal(check(device).device, 'phone'));
  }
  for (const [name, device] of Object.entries(DEVICES.dashboard)) {
    test(`${name} → dashboard`, () => assert.equal(check(device).device, 'dashboard'));
  }

  test('?dashboard keeps any device on the dashboard, and remembers it', () => {
    const phone = DEVICES.phones.iPhone;
    const first = check({ ...phone, search: '?dashboard' });
    assert.equal(first.device, 'dashboard');
    assert.equal(first.store.get('munchkinDevice'), 'dashboard');
    assert.equal(check({ ...phone, stored: { munchkinDevice: 'dashboard' } }).device, 'dashboard');
  });

  test('?auto goes back to automatic', () => {
    const result = check({ ...DEVICES.phones.iPhone, search: '?auto', stored: { munchkinDevice: 'dashboard' } });
    assert.equal(result.device, 'phone');
    assert.equal(result.store.has('munchkinDevice'), false);
  });
});
