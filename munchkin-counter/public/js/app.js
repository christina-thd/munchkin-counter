// Tablet / TV app: the start page and the dashboard live in one page and switch without reloading,
// because browsers leave full screen whenever a new page loads. The address still follows the view
// ('./' start page, 'table' dashboard), so links, bookmarks and the back button keep working.
import { setActionSource, subscribe } from './shared/api.js';
import { $ } from './shared/dom.js';
import { keepScreenOn, setupFullscreenButton } from './shared/screen.js';
import { createLobby } from './lobby/lobby.js';
import { createDashboard } from './table/dashboard.js';

const ROUTES = { lobby: './', dashboard: 'table' };
const routeFromAddress = () => (/\/table\/?$/.test(location.pathname) ? 'dashboard' : 'lobby');

setActionSource('dashboard');
keepScreenOn();
document.querySelectorAll('.fullscreen-button').forEach(setupFullscreenButton);

const lobby = createLobby({ openDashboard: () => go('dashboard') });
const dashboard = createDashboard({ openLobby: () => go('lobby') });

function show(route) {
  $('lobbyView').hidden = route !== 'lobby';
  $('tableView').hidden = route !== 'dashboard';
  if (route === 'dashboard') dashboard.show();
  else dashboard.hide();
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
