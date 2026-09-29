// Screen helpers for the tablet / TV pages: keep the screen on, and full screen.
/**
 * Keeps the screen from dimming or locking while the page is open.
 * Uses the Wake Lock API where available (https or localhost). On plain http, which is how
 * the tablet reaches the add-on at home, it loops a tiny silent video instead: devices don't
 * sleep while a video plays. Browsers only start video after a tap, so it (re)starts on taps.
 */
export function keepScreenOn() {
  let lock = null;
  let video = null;

  const awake = () => (lock && !lock.released) || (video && !video.paused);

  async function request() {
    if (document.visibilityState !== 'visible' || awake()) return;
    if ('wakeLock' in navigator) {
      try {
        lock = await navigator.wakeLock.request('screen');
        return;
      } catch {
        // not allowed here (e.g. no user gesture yet): try the video
      }
    }
    video ??= createWakeVideo();
    video.play().catch(() => {});
  }

  document.addEventListener('visibilitychange', request);   // locks are released when the tab is hidden
  addEventListener('pointerdown', request, { passive: true });
  request();
}

function createWakeVideo() {
  const video = document.createElement('video');
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('aria-hidden', 'true');
  video.style.cssText = 'position:fixed;left:0;bottom:0;width:1px;height:1px;opacity:0.01;pointer-events:none';
  for (const [src, type] of [['media/wake.webm', 'video/webm'], ['media/wake.mp4', 'video/mp4']]) {
    const source = document.createElement('source');
    source.src = src;
    source.type = type;
    video.append(source);
  }
  document.body.append(video);
  return video;
}

const root = document.documentElement;
const enterFullscreen = root.requestFullscreen ?? root.webkitRequestFullscreen;
const exitFullscreen = document.exitFullscreen ?? document.webkitExitFullscreen;
const isFullscreen = () => Boolean(document.fullscreenElement ?? document.webkitFullscreenElement);

/** Already running as a home-screen app, where the browser UI is gone anyway. */
const isInstalledApp = () => matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches
  || navigator.standalone === true;

function goFullscreen() {
  try {
    enterFullscreen.call(root)?.catch?.(() => {});
  } catch {
    // refused by the browser: nothing to do
  }
}

/**
 * Wires a full-screen toggle button. The start page and dashboard are one page (see app.js),
 * so full screen stays on when moving between them.
 * The button hides itself where full screen isn't possible (iPhone) or not needed (home-screen app).
 */
export function setupFullscreenButton(button) {
  if (!enterFullscreen || isInstalledApp()) {
    button.hidden = true;
    return;
  }

  const update = () => {
    const on = isFullscreen();
    button.classList.toggle('active', on);
    button.title = on ? 'Exit full screen' : 'Full screen';
    button.setAttribute('aria-label', button.title);
  };

  button.addEventListener('click', () => {
    if (isFullscreen()) exitFullscreen.call(document);
    else goFullscreen();
  });
  document.addEventListener('fullscreenchange', update);
  document.addEventListener('webkitfullscreenchange', update);
  update();
}
