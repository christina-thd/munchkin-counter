#!/usr/bin/env node
// Munchkin Counter: tablet dashboard + phone controls over the home network.
import http from 'node:http';
import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { createInitialState, normalizeState } from './game/state.js';
import { JsonFileStore } from './store.js';

const config = loadConfig();
const store = new JsonFileStore(config.stateFile);
const state = normalizeState(store.load() ?? createInitialState());
const app = createApp({ config, state, store });
const server = http.createServer(app.handle);

server.listen(config.port, config.host, () => {
  const tablet = app.joinUrl().replace(/\/join$/, '/');
  console.log(`Munchkin Counter ${config.version}`);
  console.log(`  Tablet / TV:  ${tablet}`);
  console.log(`  Phones:       ${app.joinUrl()}  (or scan the QR code on the tablet)`);
  console.log(`  Games saved:  ${config.stateFile}`);
});

// Save anything pending and close connections before exiting (Ctrl+C, add-on stop).
function shutdown(signal) {
  console.log(`${signal} received, shutting down`);
  store.flush();
  app.hub.close();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 2000).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
