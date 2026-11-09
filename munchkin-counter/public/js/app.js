// Tablet / TV app: the start page and the dashboard live in one page and switch without reloading,
// because browsers leave full screen whenever a new page loads. The address still follows the view
// ('./' start page, 'table' dashboard), so links, bookmarks and the back button keep working.
import { setActionSource, subscribe } from './shared/api.js';
import { $ } from './shared/dom.js';
import { fillIcons } from './shared/icons.js';
import { keepScreenOn, setupFullscreenButton } from './shared/screen.js';
import { createLobby } from './lobby/lobby.js';
import { createDashboard } from './table/dashboard.js';
import { Music } from './table/music.js';
import { showSoundSettings } from './table/sound-settings.js';
import { Soundboard } from './table/sounds.js';

const ROUTES = { lobby: './', dashboard: 'table' };
const routeFromAddress = () => (/\/table\/?$/.test(location.pathname) ? 'dashboard' : 'lobby');

setActionSource('dashboard');
fillIcons();
keepScreenOn();
document.querySelectorAll('.fullscreen-button').forEach(setupFullscreenButton);

// Sound: the effects (the dashboard's) and the music (one tune on the start page, the shuffle during a game).
// The speaker button on both views opens a popup to turn either on or off and set the music's volume.
const sounds = new Soundboard();
const music = new Music();
const soundButtons = document.querySelectorAll('.sound-button');
function showSoundState() {
  const on = sounds.enabled || music.enabled;
  for (const button of soundButtons) {
    button.classList.toggle('muted', !on);       // the speaker gets a slash through it (css/base.css)
  }
}
soundButtons.forEach((button) => button.addEventListener('click', () => {
  showSoundSettings({ sounds, music, onChange: showSoundState });
}));
showSoundState();

const lobby = createLobby({ openDashboard: () => go('dashboard') });
const dashboard = createDashboard({ openLobby: () => go('lobby'), music, sounds });

function show(route) {
  $('lobbyView').hidden = route !== 'lobby';
  $('tableView').hidden = route !== 'dashboard';
  if (route === 'dashboard') dashboard.show();
  else dashboard.hide();
  music.play(route === 'dashboard' ? 'game' : 'home');
}

function go(route) {
  if (routeFromAddress() !== route) history.pushState(null, '', ROUTES[route]);
  show(route);
}

addEventListener('popstate', () => show(routeFromAddress()));   // browser back / forward

subscribe((view) => {
  lobby.update(view);
  dashboard.update(view);
});

show(routeFromAddress());
