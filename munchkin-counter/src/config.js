import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function parsePort(value) {
  const port = Number(value);
  return Number.isInteger(port) && port > 0 && port < 65536 ? port : null;
}

/**
 * Environment variables (the Home Assistant add-on sets them in run.sh):
 *   PORT        port to listen on (default 3000)
 *   HOST        interface to bind (default all)
 *   HOST_IP     address shown in the QR code, when auto-detection picks the wrong one
 *   STATE_FILE  where games are saved (default ./data/state.json)
 *   LOGO_FILE   your own logo image (png, jpg, webp or svg) instead of the built-in one
 */
export function loadConfig(env = process.env) {
  const pkg = JSON.parse(readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'));

  return Object.freeze({
    version: pkg.version,
    port: parsePort(env.PORT) ?? 3000,
    host: env.HOST || '0.0.0.0',
    publicHost: env.HOST_IP || null,
    stateFile: env.STATE_FILE || path.join(ROOT_DIR, 'data', 'state.json'),
    logoFile: env.LOGO_FILE || null,
    publicDir: path.join(ROOT_DIR, 'public'),
  });
}
