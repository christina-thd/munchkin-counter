// Client for the server API. Paths are relative so the app also works behind
// Home Assistant ingress (served under /api/hassio_ingress/<token>/).

let source = null;

/** Which kind of screen this is ('dashboard' or 'phone'); shown next to its actions in the activity log. */
export function setActionSource(name) {
  source = name;
}

export async function sendAction(action) {
  const res = await fetch('api/actions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(source ? { ...action, source } : action),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body;
}

export const fetchInfo = () => fetch('api/info').then((res) => res.json());

/** The activity log of a game: { gameId, name, entries } (oldest first). */
export async function fetchLog(gameId) {
  const res = await fetch(`api/log?game=${encodeURIComponent(gameId)}`);
  if (!res.ok) throw new Error(`Log not available (${res.status})`);
  return res.json();
}

/**
 * Calls `onView` with the full view on connect and after every change.
 * If the server was updated to a new version while the page stayed open, reloads the page
 * so it never runs old code against the new server.
 */
export function subscribe(onView) {
  let version = null;
  const events = new EventSource('api/events');
  events.onmessage = (event) => {
    const view = JSON.parse(event.data);
    if (version && view.version !== version) {
      location.reload();
      return;
    }
    version = view.version;
    onView(view);
  };
  return events;
}
