#!/usr/bin/env node
// Munchkin Counter: tablet dashboard + phone controls over the home network.
import { readFileSync } from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { createInitialState, normalizeState } from './game/state.js';
import { JsonFileStore } from './store.js';

const config = loadConfig();
const store = new JsonFileStore(config.stateFile);
const state = normalizeState(store.load() ?? createInitialState());

let httpsRunning = false;
const app = createApp({ config, state, store, httpsActive: () => httpsRunning });
const servers = [http.createServer(app.handle)];

servers[0].listen(config.port, config.host, () => {
  const tablet = app.joinUrl().replace(/\/join$/, '/');
  console.log(`Munchkin Counter ${config.version}`);
  console.log(`  Tablet / TV:  ${tablet}`);
  console.log(`  Phones:       ${app.joinUrl()}  (or scan the QR code on the tablet)`);
  console.log(`  Games saved:  ${config.stateFile}`);
});

// Optional https, so tablets can use the Wake Lock API (keeps the screen on). http keeps working either way.
if (config.httpsPort && config.tlsCert && config.tlsKey) {
  try {
    const secure = https.createServer({ cert: readFileSync(config.tlsCert), key: readFileSync(config.tlsKey) }, app.handle);
    secure.on('error', (err) => console.warn(`https not available: ${err.message}`));
    secure.listen(config.httpsPort, config.host, () => {
      httpsRunning = true;
      console.log(`  Secure:       ${app.secureUrl()}  (keeps tablet screens on)`);
    });
    servers.push(secure);
  } catch (err) {
    console.warn(`https not available: ${err.message}`);
  }
}

// Save anything pending and close connections before exiting (Ctrl+C, add-on stop).
function shutdown(signal) {
  console.log(`${signal} received, shutting down`);
  store.flush();
  app.hub.close();
  let open = servers.length;
  for (const server of servers) server.close(() => { if (--open === 0) process.exit(0); });
  setTimeout(() => process.exit(0), 2000).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
