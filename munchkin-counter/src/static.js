import fs from 'node:fs';
import path from 'node:path';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

/** Resolves `relative` inside `root`, or returns null if it would escape it (e.g. `../`). */
export function resolveInside(root, relative) {
  const base = path.resolve(root);
  const full = path.resolve(base, `.${path.sep}${relative}`);
  return full.startsWith(base + path.sep) ? full : null;
}

/** Streams a file with its content type. Calls `onMissing` if it doesn't exist or isn't served. */
export function sendFile(res, file, onMissing) {
  const type = MIME_TYPES[path.extname(file).toLowerCase()];
  if (!type) return onMissing();
  fs.stat(file, (err, stats) => {
    if (err || !stats.isFile()) return onMissing();
    res.writeHead(200, {
      'Content-Type': type,
      'Content-Length': stats.size,
      // LAN app that gets updated in place: always revalidate so updates show up on reload
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    });
    fs.createReadStream(file).pipe(res);
  });
}
