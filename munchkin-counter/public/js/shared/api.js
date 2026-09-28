// Client for the server API. Paths are relative so the app also works behind
// Home Assistant ingress (served under /api/hassio_ingress/<token>/).

export async function sendAction(action) {
  const res = await fetch('api/actions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(action),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body;
}

export const fetchInfo = () => fetch('api/info').then((res) => res.json());

/**
 * Calls `onView` with the full view on connect and after every change.
 * If the server was updated to a new version while the page stayed open, reloads the page
 * so it never runs old code against the new server.
 */
export function subscribe(onView) {
  let version = null;
  const source = new EventSource('api/events');
  source.onmessage = (event) => {
    const view = JSON.parse(event.data);
    if (version && view.version !== version) {
      location.reload();
      return;
    }
    version = view.version;
    onView(view);
  };
  return source;
}
