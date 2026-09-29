import fs from 'node:fs';
import path from 'node:path';
import QRCode from 'qrcode';
import { EMOJIS } from '../public/js/shared/rules.js';
import { ActionError, applyAction } from './game/actions.js';
import { gameLog, toView } from './game/state.js';
import { lanAddress } from './network.js';
import { SseHub } from './sse.js';
import { resolveInside, sendFile } from './static.js';

const MAX_BODY_BYTES = 10 * 1024;

const PAGES = {
  '/': 'index.html',
  '/table': 'table.html',
  '/join': 'phone.html',
  '/manifest.webmanifest': 'manifest.webmanifest',
};
const STATIC_DIRS = ['/css/', '/js/', '/img/', '/media/'];

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function sendJson(res, status, body) {
  const json = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(json);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new HttpError(413, 'Request body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new HttpError(400, 'Body must be valid JSON'));
      }
    });
    req.on('error', reject);
  });
}

/**
 * Builds the request handler.
 *
 *   GET  /              start page (tablet / TV): continue, new game, past games
 *   GET  /table         dashboard (tablet / TV)
 *   GET  /join          phone controls
 *   GET  /manifest.webmanifest   web app manifest ("Add to Home Screen" opens full screen)
 *   GET  /css/*, /js/*, /img/*, /media/*   static files (byte ranges supported, for video)
 *   GET  /logo          the logo: LOGO_FILE if set and present, else public/img/logo.svg
 *   GET  /qr.svg        QR code pointing phones at /join
 *   GET  /api/info      { version, joinUrl, secureUrl, emojis }
 *   GET  /munchkin-counter.crt   the https certificate, to install on a tablet (no warning after that)
 *   GET  /api/events    live view (Server-Sent Events)
 *   GET  /api/log?game=<id>   activity log of a game (the current one if no id)
 *   POST /api/actions   apply one action, e.g. { "type": "changeLevel", "playerId": "…", "delta": 1 }
 */
export function createApp({
  config, state, store, hub = new SseHub(), now = Date.now, logger = console,
  httpsActive = () => false,   // whether the https server is running (see server.js)
}) {
  const view = () => toView(state, config.version);
  const host = () => config.publicHost ?? lanAddress();
  const joinUrl = () => `http://${host()}:${config.port}/join`;
  const secureUrl = () => (httpsActive() ? `https://${host()}:${config.httpsPort}/` : null);

  let qr = { url: null, svg: null };
  async function qrSvg() {
    const url = joinUrl();
    if (qr.url !== url) qr = { url, svg: await QRCode.toString(url, { type: 'svg', margin: 1 }) };
    return qr.svg;
  }

  async function dispatch(req, res) {
    const action = await readJsonBody(req);
    const result = applyAction(state, action, now());
    store.save(state);
    hub.broadcast(view());
    sendJson(res, 200, result);
  }

  function notFound(res) {
    sendJson(res, 404, { error: 'Not found' });
  }

  function sendCertificate(res) {
    if (!httpsActive() || !config.tlsCert) return notFound(res);
    fs.readFile(config.tlsCert, (err, pem) => {
      if (err) return notFound(res);
      res.writeHead(200, {
        'Content-Type': 'application/x-x509-ca-cert',
        'Content-Disposition': 'attachment; filename="munchkin-counter.crt"',
        'Cache-Control': 'no-cache',
      });
      res.end(pem);
    });
  }

  const defaultLogo = path.join(config.publicDir, 'img', 'logo.svg');
  function sendLogo(req, res) {
    const fallback = () => sendFile(req, res, defaultLogo, () => notFound(res));
    return config.logoFile ? sendFile(req, res, config.logoFile, fallback) : fallback();
  }

  async function route(req, res) {
    const { pathname, searchParams } = new URL(req.url, 'http://localhost');
    const method = req.method;

    if (pathname === '/api/actions') {
      if (method !== 'POST') throw new HttpError(405, 'Use POST');
      return dispatch(req, res);
    }
    if (method !== 'GET' && method !== 'HEAD') throw new HttpError(405, 'Method not allowed');

    if (pathname === '/api/events') return hub.connect(req, res, view());
    if (pathname === '/api/log') {
      const log = gameLog(state, searchParams.get('game') || state.currentGameId);
      return log ? sendJson(res, 200, log) : sendJson(res, 404, { error: 'No such game' });
    }
    if (pathname === '/api/info') {
      return sendJson(res, 200, { version: config.version, joinUrl: joinUrl(), secureUrl: secureUrl(), emojis: EMOJIS });
    }
    if (pathname === '/munchkin-counter.crt') return sendCertificate(res);
    if (pathname === '/logo') return sendLogo(req, res);
    if (pathname === '/qr.svg') {
      res.writeHead(200, { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-cache' });
      return res.end(await qrSvg());
    }
    if (Object.hasOwn(PAGES, pathname)) {
      return sendFile(req, res, path.join(config.publicDir, PAGES[pathname]), () => notFound(res));
    }
    if (STATIC_DIRS.some((dir) => pathname.startsWith(dir))) {
      let decoded;
      try {
        decoded = decodeURIComponent(pathname);
      } catch {
        throw new HttpError(400, 'Malformed path');
      }
      const file = resolveInside(config.publicDir, decoded);
      return file ? sendFile(req, res, file, () => notFound(res)) : notFound(res);
    }
    return notFound(res);
  }

  async function handle(req, res) {
    try {
      await route(req, res);
    } catch (err) {
      if (err instanceof ActionError || err instanceof HttpError) return sendJson(res, err.status, { error: err.message });
      logger.error(err);
      if (!res.headersSent) sendJson(res, 500, { error: 'Internal error' });
      else res.end();
    }
  }

  return { handle, hub, joinUrl, secureUrl };
}
